import subprocess
import time

def get_screenshot(filename="screen.png"):
    print("Mendapatkan screenshot dari ponsel...")
    with open(filename, "wb") as f:
        # Use adb exec-out which is faster and doesn't corrupt binary data on Windows
        process = subprocess.Popen(['.\\adb.exe', 'exec-out', 'screencap', '-p'], stdout=f)
        process.wait()
    return filename

def tap(x, y):
    subprocess.run(['.\\adb.exe', 'shell', 'input', 'tap', str(x), str(y)])

def swipe(x1, y1, x2, y2, duration=300):
    subprocess.run(['.\\adb.exe', 'shell', 'input', 'swipe', str(x1), str(y1), str(x2), str(y2), str(duration)])
