from flask import Flask, render_template, request, jsonify, send_file
import os
import time
from adb_controller import get_screenshot, tap
from vision import extract_sudoku_from_area
from solver import solve, print_board

app = Flask(__name__)
stop_requested = False

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/screen')
def screen():
    # Mengambil screenshot terbaru
    img_path = get_screenshot("static_screen.png")
    # Karena bisa saja proses adb butuh waktu, pastikan file ada
    if os.path.exists(img_path):
        return send_file(img_path, mimetype='image/png')
    else:
        return "Not Found", 404

@app.route('/stop', methods=['POST'])
def stop_solve():
    global stop_requested
    stop_requested = True
    return jsonify({'status': 'success'})

@app.route('/solve', methods=['POST'])
def api_solve():
    global stop_requested
    stop_requested = False
    
    data = request.json
    area1 = data.get('area1') # Grid
    area2 = data.get('area2') # Baris Angka
    
    if not area1 or not area2:
        return jsonify({'status': 'error', 'message': 'Area 1 dan Area 2 harus dipilih.'})
        
    try:
        # 1. Pastikan kita punya screenshot terbaru untuk di-OCR
        img_path = get_screenshot("solve_screen.png")
        
        # 2. Ekstrak kotak Sudoku dari Area 1
        board, original_board = extract_sudoku_from_area(img_path, area1)
        
        print("Board Terdeteksi:")
        print_board(board)
        
        # 3. Pecahkan
        if not solve(board):
            return jsonify({'status': 'error', 'message': 'Puzzle tidak dapat dipecahkan. OCR mungkin salah mendeteksi angka.'})
            
        print("Board Solved:")
        print_board(board)
        
        # 4. Input via ADB
        cell_w = area1['w'] / 9
        cell_h = area1['h'] / 9
        
        num_w = area2['w'] / 9
        num_h = area2['h']
        
        # Urutan loop input
        for i in range(9):
            for j in range(9):
                if stop_requested:
                    return jsonify({'status': 'error', 'message': 'Proses dihentikan secara manual.'})
                    
                if original_board[i][j] == 0:
                    answer = board[i][j]
                    
                    # Hitung koordinat tap kotak (Area 1)
                    cell_x = int(area1['x'] + (j * cell_w) + (cell_w / 2))
                    cell_y = int(area1['y'] + (i * cell_h) + (cell_h / 2))
                    
                    # Hitung koordinat tap angka (Area 2)
                    # Karena answer 1-9, indexnya adalah (answer - 1)
                    idx = answer - 1
                    num_x = int(area2['x'] + (idx * num_w) + (num_w / 2))
                    num_y = int(area2['y'] + (num_h / 2))
                    
                    # Eksekusi Tap
                    tap(cell_x, cell_y)
                    time.sleep(0.1) # Sesuaikan jika HP agak lambat
                    tap(num_x, num_y)
                    time.sleep(0.1)
                    
        return jsonify({'status': 'success'})
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'status': 'error', 'message': str(e)})

if __name__ == '__main__':
    # Hapus file screen lama jika ada
    if os.path.exists("static_screen.png"):
        os.remove("static_screen.png")
    app.run(host='0.0.0.0', port=5000, debug=True)
