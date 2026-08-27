import cv2
import numpy as np
import pytesseract
import re
import pytesseract

# Konfigurasi Tesseract (Sesuaikan path jika diperlukan di Windows)
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

def extract_sudoku_from_area(img_path, area):
    img = cv2.imread(img_path)
    if img is None:
        raise Exception(f"Gagal membaca gambar dari ponsel (file mungkin kosong atau perangkat tidak terdeteksi).")
    
    x = area['x']
    y = area['y']
    w = area['w']
    h = area['h']
    
    # Potong gambar sesuai area yang dipilih di web
    crop = img[y:y+h, x:x+w]
    
    # Konversi ke Grayscale
    gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
    
    cell_w = w // 9
    cell_h = h // 9
    
    board = []
    original_board = []
    
    for i in range(9):
        row = []
        for j in range(9):
            startX = j * cell_w
            startY = i * cell_h
            
            # Crop dengan sedikit margin ke dalam agar garis tepi kotak tidak ikut terbaca
            margin_x = int(cell_w * 0.08)
            margin_y = int(cell_h * 0.08)
            
            cell = gray[startY+margin_y:startY+cell_h-margin_y, startX+margin_x:startX+cell_w-margin_x]
            
            # Perbesar gambar 2x lipat agar Tesseract lebih mudah membaca
            cell = cv2.resize(cell, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
            
            # Blur sedikit untuk menghaluskan tepian pixel (sangat membantu untuk angka 9/8/6)
            cell = cv2.GaussianBlur(cell, (3,3), 0)
            
            # Preprocessing untuk tesseract
            _, cell_thresh = cv2.threshold(cell, 128, 255, cv2.THRESH_BINARY_INV | cv2.THRESH_OTSU)
            
            # Hitung jumlah pixel putih, jika terlalu sedikit berarti kosong
            # Batas dihitung ulang karena gambar sudah di-resize 2x (luas jadi 4x lipat)
            white_pixels = cv2.countNonZero(cell_thresh)
            if white_pixels < 30:
                row.append(0)
            else:
                # Tesseract bekerja sangat optimal pada teks HITAM dengan latar PUTIH.
                # cell_thresh saat ini adalah teks putih latar hitam (karena THRESH_BINARY_INV).
                # Kita harus meng-invert-nya kembali khusus untuk Tesseract.
                tesseract_img = cv2.bitwise_not(cell_thresh)
                
                # Coba dengan psm 10 (Single Character)
                config10 = '--psm 10 -c tessedit_char_whitelist=123456789'
                text = pytesseract.image_to_string(tesseract_img, config=config10)
                digits = re.findall(r'\d', text)
                
                # Jika psm 10 gagal, gunakan fallback psm 8 (Single Word)
                if not digits:
                    config8 = '--psm 8 -c tessedit_char_whitelist=123456789'
                    text = pytesseract.image_to_string(tesseract_img, config=config8)
                    digits = re.findall(r'\d', text)
                    
                if digits:
                    row.append(int(digits[0]))
                else:
                    row.append(0)
        board.append(row)
        
    # Buat salinan original board
    original_board = [r[:] for r in board]
    
    return board, original_board
