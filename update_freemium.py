import re

with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/app.js', 'r', encoding='utf-8') as f:
    content = f.read()

desktop_logic = '''
// ==========================================
// DESKTOP FREEMIUM & ACTIVATION LOGIC
// ==========================================
const isDesktopEnv = typeof process !== 'undefined' && process.versions && process.versions.electron;
let isDesktopPro = false;

if (isDesktopEnv) {
  const fs = require('fs');
  const path = require('path');
  const crypto = require('crypto');
  const { app } = require('@electron/remote') || { app: null }; // Optional if needed, but we'll use localStorage for simplicity
  
  // Verifikasi Kunci
  window.verifyDesktopKey = function(key) {
    try {
      const parts = key.split('-');
      if (parts.length !== 3 || parts[0] !== 'WBT') return false;
      const part1 = parts[1];
      const part2 = parts[2];
      const secret = "WBT_SECRET_2026";
      const hash = crypto.createHash('sha1').update(part1 + secret).digest('hex').substring(0, 4).toUpperCase();
      return hash === part2;
    } catch(e) {
      return false;
    }
  };

  // Cek Lisensi Tersimpan
  const savedKey = localStorage.getItem('wbt_desktop_license');
  if (savedKey && verifyDesktopKey(savedKey)) {
    isDesktopPro = true;
  }
}

function showDesktopActivationModal(callback) {
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.8); z-index:999999; display:flex; align-items:center; justify-content:center; color:white; font-family:sans-serif; backdrop-filter: blur(5px);';
  
  modal.innerHTML = 
    <div style="background:#1e293b; padding:40px; border-radius:12px; width:450px; text-align:center; border:1px solid #3b82f6;">
      <h2 style="color:#38bdf8; margin-top:0;">WBT Desktop PRO Required</h2>
      <p style="color:#cbd5e1; font-size:14px; margin-bottom:20px;">Fitur ini eksklusif untuk versi Premium. Anda sedang menggunakan versi Gratis (hanya mendukung Split & Merge).</p>
      
      <button onclick="window.open('https://wbtdigitallabs.myr.id/pl/lisensi-premium-wbt-desktop-pro/', '_blank')" style="background:transparent; border:1px solid #3b82f6; color:#38bdf8; padding:12px; width:100%; border-radius:6px; cursor:pointer; font-weight:bold; margin-bottom:20px;">
        Beli Lisensi (Rp 30.000)
      </button>
      
      <div style="border-top:1px solid #334155; padding-top:20px; position:relative;">
        <span style="position:absolute; top:-10px; left:50%; transform:translateX(-50%); background:#1e293b; padding:0 10px; font-size:12px; color:#64748b;">SUDAH PUNYA KODE?</span>
        <input type="text" id="modal-license-key" placeholder="WBT-XXXX-YYYY" style="width:90%; padding:12px; margin-bottom:15px; background:#0f172a; border:1px solid #475569; color:white; text-align:center; letter-spacing:2px; font-weight:bold; border-radius:6px;">
        <button id="btn-activate-modal" style="background:#10b981; color:white; border:none; padding:12px; width:100%; border-radius:6px; font-weight:bold; cursor:pointer;">Aktifkan Aplikasi</button>
      </div>
      <button id="btn-close-modal" style="margin-top:15px; background:transparent; color:#94a3b8; border:none; cursor:pointer; text-decoration:underline;">Tutup</button>
    </div>
  ;
  document.body.appendChild(modal);

  document.getElementById('btn-close-modal').onclick = () => document.body.removeChild(modal);
  
  document.getElementById('btn-activate-modal').onclick = () => {
    const key = document.getElementById('modal-license-key').value.trim();
    if (!key) return alert('Masukkan Kunci Lisensi!');
    if (window.verifyDesktopKey(key)) {
      localStorage.setItem('wbt_desktop_license', key);
      isDesktopPro = true;
      alert('Aktivasi Berhasil! Terima kasih telah membeli WBT Document Toolkit Pro.');
      document.body.removeChild(modal);
      if(callback) callback();
    } else {
      alert('Kunci Lisensi tidak valid atau salah.');
    }
  };
}
'''

# Update executeProcessing to check Desktop Freemium logic
# We need to find sync function executeProcessing() { and replace it
old_exec = '''async function executeProcessing() {
    try {'''
new_exec = '''async function executeProcessing() {
    // Cek batas Desktop Freemium
    if (isDesktopEnv && !isDesktopPro) {
      if (activeTool !== 'merge' && activeTool !== 'split') {
        return showDesktopActivationModal(executeProcessing);
      }
    }
    
    try {'''

content = content.replace('async function processCurrentTool() {', desktop_logic + '\n\nasync function processCurrentTool() {')
content = content.replace(old_exec, new_exec)

with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Berhasil update Desktop Freemium.")
