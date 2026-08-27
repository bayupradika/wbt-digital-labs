from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, StreamingResponse
from pydantic import BaseModel
import uvicorn
import adbutils
import io
import time
import os
import glob
import cv2
import numpy as np
import threading

from fastapi.staticfiles import StaticFiles

app = FastAPI()
app.mount("/templates", StaticFiles(directory="templates"), name="templates")

device = None
bot_running = False
latest_frame = None
latest_frame_lock = threading.Lock()
current_state_tiles = []

os.makedirs('templates', exist_ok=True)

# Pre-load templates
templates = {}

def load_templates():
    global templates
    new_templates = {}
    if not os.path.exists('templates'):
        os.makedirs('templates')
    for path in glob.glob('templates/*.jpg'):
        filename = os.path.basename(path).split('.')[0]
        label = filename.split('_')[0]
        new_templates[filename] = {'img': cv2.imread(path, cv2.IMREAD_COLOR), 'label': label}
    templates = new_templates

load_templates()

def get_device():
    global device
    if device is None:
        try:
            adb = adbutils.AdbClient(host='127.0.0.1', port=5037)
            devices = adb.device_list()
            if devices:
                device = devices[0]
        except Exception as e:
            pass
    return device

# --- BOT LOGIC THREAD ---
def click_adb(x, y):
    d = get_device()
    if d:
        d.click(x, y)
        print(f"Clicked {x}, {y}")

def bot_loop():
    global bot_running, latest_frame
    while True:
        d = get_device()
        if not d:
            time.sleep(1)
            continue
            
        try:
            pil_img = d.screenshot()
            frame_cv = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
            
            detected = []
            threshold = 0.60 # Sangat rendah agar kartu Layer 2/3 yang tertutup sebagian tetap terdeteksi
            
            # --- HIGH PERFORMANCE NMS (Non-Maximum Suppression) ---
            all_points = []
            for fname, tmpl_data in list(templates.items()):
                label = tmpl_data['label']
                tmpl = tmpl_data['img']
                res = cv2.matchTemplate(frame_cv, tmpl, cv2.TM_CCOEFF_NORMED)
                y_loc, x_loc = np.where(res >= threshold)
                scores = res[y_loc, x_loc]
                h, w = tmpl.shape[:2]
                for pt_x, pt_y, s in zip(x_loc, y_loc, scores):
                    all_points.append((s, pt_x, pt_y, label, w, h, fname))
            
            # Urutkan semua titik dari skor tertinggi ke terendah (O(N log N))
            all_points.sort(key=lambda x: x[0], reverse=True)
            
            # Mask spasial untuk mengecek tumpang tindih dalam O(1)
            occupied_mask = np.zeros(frame_cv.shape[:2], dtype=bool)
            
            for s, pt_x, pt_y, label, w, h, fname in all_points:
                if occupied_mask[pt_y, pt_x]:
                    continue # Sudah ada objek dengan skor lebih tinggi di area ini
                    
                # Tandai area radius 20px sebagai terisi
                min_y, max_y = max(0, pt_y-20), min(occupied_mask.shape[0], pt_y+20)
                min_x, max_x = max(0, pt_x-20), min(occupied_mask.shape[1], pt_x+20)
                occupied_mask[min_y:max_y, min_x:max_x] = True
                
                detected.append({
                    'id': len(detected), 'label': label, 'fname': fname, 'score': float(s),
                    'x': int(pt_x), 'y': int(pt_y), 'w': int(w), 'h': int(h), 
                    'cx': int(pt_x+w//2), 'cy': int(pt_y+h//2),
                    'blocks': [], 'blocked_by': [], 'layer': -1, 'strategic_score': 0
                })
            
            board_tiles = [t for t in detected if t['cy'] < 1700]
            tray_tiles = [t for t in detected if t['cy'] >= 1700]
            
            # --- Bangun Grafik Tumpang Tindih (Layering Graph) ---
            for i in range(len(board_tiles)):
                for j in range(len(board_tiles)):
                    if i == j: continue
                    A = board_tiles[i]
                    B = board_tiles[j]
                    
                    # Hitung Area Overlap (Persinggungan)
                    overlap_w = max(0, min(A['x'] + A['w'], B['x'] + B['w']) - max(A['x'], B['x']))
                    overlap_h = max(0, min(A['y'] + A['h'], B['y'] + B['h']) - max(A['y'], B['y']))
                    overlap_area = overlap_w * overlap_h
                    tile_area = A['w'] * A['h']
                    
                    # Sesuai ide Anda: Jika tertindih > 15-20%, dia bukan Layer 1
                    if overlap_area > 0.15 * tile_area:
                        # Kartu yang menindih (berada di atas) pasti memiliki skor visibilitas OpenCV yang lebih tinggi
                        # karena bentuknya utuh 100%, sedangkan kartu di bawahnya terpotong.
                        if A['score'] > B['score']:
                            if j not in A['blocks']: A['blocks'].append(j)
                            if i not in B['blocked_by']: B['blocked_by'].append(i)
                        else:
                            if i not in B['blocks']: B['blocks'].append(i)
                            if j not in A['blocked_by']: A['blocked_by'].append(j)
                                
            # Kalkulasi Layer
            for i, t in enumerate(board_tiles):
                if len(t['blocked_by']) == 0:
                    t['layer'] = 1
            for i, t in enumerate(board_tiles):
                if t['layer'] == -1 and all(board_tiles[b]['layer'] == 1 for b in t['blocked_by']):
                    t['layer'] = 2
            for i, t in enumerate(board_tiles):
                if t['layer'] == -1:
                    t['layer'] = 3
                    
            layer1 = [t for t in board_tiles if t['layer'] == 1]
            
            # --- Self-Correcting Blacklist Logic ---
            global last_click_info, failed_clicks
            if 'last_click_info' not in globals():
                last_click_info = None
                failed_clicks = []
                
            if last_click_info is not None:
                # Cek apakah kartu yang diklik sebelumnya MASIH ADA di posisi yang sama
                click_failed = False
                for t in layer1:
                    if t['label'] == last_click_info['label'] and abs(t['cx'] - last_click_info['cx']) < 20 and abs(t['cy'] - last_click_info['cy']) < 20:
                        click_failed = True
                        break
                
                if click_failed:
                    # Kartu ternyata terkunci (game menolak klik). Masukkan ke blacklist!
                    failed_clicks.append((last_click_info['cx'], last_click_info['cy']))
                last_click_info = None
                
            # Terapkan Blacklist: Paksa kartu yang gagal diklik menjadi Layer 2
            for t in layer1[:]: # iterasi salinan list
                for fx, fy in failed_clicks:
                    if abs(t['cx'] - fx) < 20 and abs(t['cy'] - fy) < 20:
                        t['layer'] = 2
                        layer1.remove(t)
                        break
            
            move_made = False
            if bot_running:
                tray_counts = {}
                for t in tray_tiles:
                    tray_counts[t['label']] = tray_counts.get(t['label'], 0) + 1
                    
                # LOOKAHEAD HEURISTIC: Beri nilai tambah pada Layer 1 jika dia membuka kartu kritis di Layer 2/3
                for t in layer1:
                    t['strategic_score'] = len(t['blocks']) * 10 # Base score
                    for b_idx in t['blocks']:
                        under_tile = board_tiles[b_idx]
                        req_label = under_tile['label']
                        have_count = tray_counts.get(req_label, 0)
                        have_count += len([x for x in layer1 if x['label'] == req_label and x != t])
                        
                        if have_count >= 2: t['strategic_score'] += 1000
                        elif have_count == 1: t['strategic_score'] += 100
                
                def get_best_strategic_tile(matches):
                    return sorted(matches, key=lambda t: t['strategic_score'], reverse=True)[0]
                
                def get_best_strategic_tiles(matches, count):
                    return sorted(matches, key=lambda t: t['strategic_score'], reverse=True)[:count]
                    
                def execute_click(tile):
                    click_adb(tile['cx'], tile['cy'])
                    global last_click_info
                    last_click_info = {'label': tile['label'], 'cx': tile['cx'], 'cy': tile['cy']}
                    
                # 1. Prioritas Utama: Selesaikan pasangan yang sudah ada di tray (Butuh 1 lagi)
                for label, count in tray_counts.items():
                    if count == 2:
                        l1_matches = [t for t in layer1 if t['label'] == label]
                        if l1_matches:
                            best_tile = get_best_strategic_tile(l1_matches)
                            execute_click(best_tile)
                            move_made = True
                            break
                    elif count == 1:
                        l1_matches = [t for t in layer1 if t['label'] == label]
                        if len(l1_matches) >= 2:
                            best_tiles = get_best_strategic_tiles(l1_matches, 2)
                            execute_click(best_tiles[0])
                            time.sleep(0.3)
                            execute_click(best_tiles[1])
                            move_made = True
                            break
                
                # 2. Cari 3 kembar di Layer 1
                if not move_made and len(tray_tiles) <= 4:
                    l1_counts = {}
                    for t in layer1:
                        l1_counts[t['label']] = l1_counts.get(t['label'], []) + [t]
                        
                    for label, tiles in l1_counts.items():
                        if len(tiles) >= 3:
                            best_tiles = get_best_strategic_tiles(tiles, 3)
                            for i in range(3):
                                execute_click(best_tiles[i])
                                time.sleep(0.3)
                            move_made = True
                            break
                            
                # 4. BONGKAR TUMPUKAN DENGAN LOOKAHEAD
                if not move_made and len(tray_tiles) <= 5:
                    l1_counts = {}
                    for t in layer1:
                        l1_counts[t['label']] = l1_counts.get(t['label'], []) + [t]
                    
                    # Cari 2 kembar di Layer 1 yang skor strategis gabungannya paling tinggi!
                    best_pair = None
                    best_pair_score = -1
                    for label, tiles in l1_counts.items():
                        if len(tiles) >= 2:
                            pair = sorted(tiles, key=lambda t: t['strategic_score'], reverse=True)[:2]
                            score = pair[0]['strategic_score'] + pair[1]['strategic_score']
                            if score > best_pair_score:
                                best_pair_score = score
                                best_pair = pair
                                
                    if best_pair is not None:
                        execute_click(best_pair[0])
                        time.sleep(0.3)
                        execute_click(best_pair[1])
                        move_made = True
                
                # 5. Spekulasi Ekstrim: Ambil 1 kartu paling strategis
                if not move_made and len(tray_tiles) <= 6 and len(layer1) > 0:
                    l1_sorted = sorted(layer1, key=lambda t: t['strategic_score'], reverse=True)
                    execute_click(l1_sorted[0])
                    move_made = True
                
            # Draw for web
            for det in detected:
                x, y, w, h = det['x'], det['y'], det['w'], det['h']
                # Warna Layer: Hijau = 1, Biru = 2, Ungu = 3, Merah = Tertutup Parah
                if det.get('layer') == 1: color = (0, 255, 0)
                elif det.get('layer') == 2: color = (255, 165, 0) # Orange/Blue in BGR
                elif det.get('layer') == 3: color = (255, 0, 255) # Pink/Purple
                else: color = (0, 0, 255) # Merah (Layer 4+)
                
                if det['cy'] >= 1700: color = (255, 255, 0) # Kuning untuk tray
                
                cv2.rectangle(frame_cv, (x, y), (x + w, y + h), color, 2 if det.get('layer', 1) > 1 else 3)
                
                # Tambahkan info score untuk visualisasi
                label_txt = f"{det['label']} (L{det.get('layer','?')})"
                cv2.putText(frame_cv, label_txt, (x, y - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
                
            if bot_running:
                cv2.putText(frame_cv, "BOT STATUS: RUNNING (Advanced Graph AI)", (50, 80), cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 255, 0), 4)
            else:
                cv2.putText(frame_cv, "BOT STATUS: STOPPED", (50, 80), cv2.FONT_HERSHEY_SIMPLEX, 2, (0, 0, 255), 4)
                
            cv2.putText(frame_cv, f"Tray Load: {len(tray_tiles)}/7 | Layer 1: {len([t for t in board_tiles if len(t['blocked_by'])==0])}", (50, 150), cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 255, 255), 4)

            frame_cv = cv2.resize(frame_cv, (int(frame_cv.shape[1]/2), int(frame_cv.shape[0]/2)))
            _, buffer = cv2.imencode('.jpg', frame_cv, [int(cv2.IMWRITE_JPEG_QUALITY), 60])
            with latest_frame_lock:
                latest_frame = buffer.tobytes()
            
            global current_state_tiles
            current_state_tiles = board_tiles + tray_tiles
            
            if move_made:
                time.sleep(1.5)
            else:
                time.sleep(0.5)
                
        except Exception as e:
            import traceback
            print("Bot loop error:")
            traceback.print_exc()
            time.sleep(1)

# Start bot thread
threading.Thread(target=bot_loop, daemon=True).start()

def generate_frames():
    global latest_frame
    while True:
        frame = None
        with latest_frame_lock:
            frame = latest_frame
            
        if frame is not None:
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
            time.sleep(0.1) # 10 FPS for web
        else:
            time.sleep(0.5)

@app.get('/')
def read_root():
    with open('index.html', 'r', encoding='utf-8') as f:
        return HTMLResponse(f.read())

@app.get('/editor')
def read_editor():
    with open('editor.html', 'r', encoding='utf-8') as f:
        return HTMLResponse(f.read())

@app.get('/api/templates')
def api_templates():
    return list(templates.keys())

from solver import solve_board

class CustomBoard(BaseModel):
    tiles: list

@app.post('/solve_custom')
def solve_custom(board: CustomBoard):
    try:
        solution = solve_board(board.tiles)
        if solution is None:
            return {"message": "Tidak ada jalan keluar (Game Over pasti terjadi) dengan urutan ini, atau papan terlalu rumit!"}
            
        steps = [card['label'] for card in solution]
        return {"message": f"Solusi ditemukan ({len(steps)} langkah)!\n\nUrutan klik: " + " -> ".join(steps)}
    except Exception as e:
        return {"message": f"Error saat menyelesaikan: {str(e)}"}

@app.get('/board_state')
def board_state():
    return {"tiles": current_state_tiles}

@app.get('/video_feed')
def video_feed():
    return StreamingResponse(generate_frames(), media_type='multipart/x-mixed-replace; boundary=frame')

@app.post('/toggle_bot')
def toggle_bot():
    global bot_running
    bot_running = not bot_running
    if bot_running:
        load_templates()
    return {'status': 'running' if bot_running else 'stopped'}

class ClickData(BaseModel):
    x: int
    y: int
    img_width: int
    img_height: int
    label: str

@app.post('/register_template')
def register_template(data: ClickData):
    d = get_device()
    if not d: return {'status': 'error'}
    img = d.screenshot()
    real_x = int(data.x * (img.width / data.img_width))
    real_y = int(data.y * (img.height / data.img_height))
    w, h = 80, 80
    box = (real_x - w//2, real_y - h//2, real_x + w//2, real_y + h//2)
    cropped = img.crop(box)
    
    import time
    filename = f'templates/{data.label}_{int(time.time())}.jpg'
    cropped.save(filename)
    load_templates()
    return {'status': 'success', 'file': filename}

if __name__ == '__main__':
    uvicorn.run(app, host='127.0.0.1', port=8000)
