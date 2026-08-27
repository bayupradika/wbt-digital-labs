import adbutils

def check_device():
    adb = adbutils.AdbClient(host='127.0.0.1', port=5037)
    devices = adb.device_list()
    if not devices:
        print('Tidak ada perangkat yang terdeteksi.')
        return None
    device = devices[0]
    print(f'Terhubung ke perangkat: {device.serial}')
    return device

def get_screenshot(device):
    try:
        pil_img = device.screenshot()
        return pil_img
    except Exception as e:
        print('Gagal mengambil screenshot:', e)
        return None

if __name__ == '__main__':
    d = check_device()
    if d:
        img = get_screenshot(d)
        if img:
            img.save('test_screenshot.jpg')
            print('Screenshot berhasil disimpan sebagai test_screenshot.jpg')
