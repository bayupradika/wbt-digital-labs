let tasks = [];
let currentTab = 'progress';
let host = window.location.hostname || 'localhost';
let apiBase = `http://${host}:3000/api/tasks`;
let editTaskId = null;

// Determine if running in Electron or Web/Mobile
const isElectron = navigator.userAgent.toLowerCase().indexOf(' electron/') > -1;

function loadOfflineTasks() {
    const data = localStorage.getItem('offline_tasks');
    return data ? JSON.parse(data) : [];
}

function saveOfflineTasks(tList) {
    localStorage.setItem('offline_tasks', JSON.stringify(tList));
}

async function fetchTasks() {
    try {
        const res = await fetch(apiBase);
        const data = await res.json();
        tasks = data.tasks;
        renderTasks();
        updateStats();
        const statusEl = document.getElementById('netStatus');
        if (statusEl) {
            statusEl.innerText = `● Online (${window.location.hostname})`;
            statusEl.style.color = 'var(--success-color)';
        }
    } catch (e) {
        // Fallback 100% Offline Mode (Mobile APK / Disconnected)
        tasks = loadOfflineTasks();
        renderTasks();
        updateStats();
        const statusEl = document.getElementById('netStatus');
        if (statusEl) {
            statusEl.innerText = '● Offline (Mode Lokal)';
            statusEl.style.color = 'var(--text-secondary)';
        }
    }
}

function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab-btn').forEach(btn => {
        const onclickAttr = btn.getAttribute('onclick') || '';
        if (onclickAttr.includes(`'${tab}'`) || onclickAttr.includes(`"${tab}"`)) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    renderTasks();
}

function renderTasks() {
    const tbody = document.getElementById('taskList');
    tbody.innerHTML = '';
    
    const filtered = tasks.filter(t => t.status === currentTab).sort((a, b) => {
        return new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`);
    });

    filtered.forEach(task => {
        const tr = document.createElement('tr');
        
        let actions = '';
        if (currentTab === 'progress') {
            actions = `
                <div class="action-buttons">
                    <button class="btn-success" onclick="updateStatus('${task.id}', 'success')" title="Oke">✓</button>
                    <button class="btn-edit" onclick="editTask('${task.id}')" title="Edit">✎</button>
                    <button class="btn-failed" onclick="deleteTask('${task.id}')" title="Delete">✕</button>
                </div>
            `;
        } else {
            actions = `
                <div class="action-buttons">
                    <button class="btn-failed" onclick="deleteTask('${task.id}')" title="Delete">✕</button>
                </div>
            `;
        }

        tr.innerHTML = `
            <td>${task.id}</td>
            <td>${task.name}</td>
            <td>${task.date}</td>
            <td>${task.time}</td>
            <td>${actions}</td>
        `;
        tbody.appendChild(tr);
    });
}

function updateStats() {
    const processCount = tasks.filter(t => t.status === 'progress').length;
    const success = tasks.filter(t => t.status === 'success').length;
    const failed = tasks.filter(t => t.status === 'failed').length;
    if (document.getElementById('processScore')) {
        document.getElementById('processScore').innerText = processCount;
    }
    document.getElementById('successScore').innerText = success;
    document.getElementById('failedScore').innerText = failed;
}

function generateOfflineId() {
    let offTasks = loadOfflineTasks();
    let total = offTasks.length + 1;
    let posIndex = Math.floor(total / 90000) % 6;
    let digits = Math.floor(10000 + Math.random() * 90000).toString();
    return digits.slice(0, posIndex) + 'X' + digits.slice(posIndex);
}

async function addTask() {
    const name = document.getElementById('taskName').value;
    const date = document.getElementById('taskDate').value;
    let time = document.getElementById('taskTime').value || '23:59';
    
    if (!name || !date) return alert('Nama dan Tanggal tugas harus diisi!');

    try {
        if (editTaskId) {
            await fetch(`${apiBase}/${editTaskId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, date, time })
            });
            editTaskId = null;
        } else {
            await fetch(apiBase, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, date, time })
            });
        }
    } catch (e) {
        // Fallback 100% Offline Mode
        let offTasks = loadOfflineTasks();
        if (editTaskId) {
            const idx = offTasks.findIndex(t => t.id === editTaskId);
            if (idx !== -1) offTasks[idx] = { ...offTasks[idx], name, date, time };
            editTaskId = null;
        } else {
            offTasks.push({ id: generateOfflineId(), name, date, time, status: 'progress', notified30: false, notified5: false });
        }
        saveOfflineTasks(offTasks);
    }

    const btn = document.querySelector('.add-btn') || document.querySelector('.cyber-btn');
    if (btn) btn.innerText = '+ Simpan Tugas';

    document.getElementById('taskName').value = '';
    document.getElementById('taskDate').value = '';
    document.getElementById('taskTime').value = '';
    fetchTasks();
}

async function updateStatus(id, status) {
    try {
        await fetch(`${apiBase}/${id}/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
    } catch (e) {
        let offTasks = loadOfflineTasks();
        const idx = offTasks.findIndex(t => t.id === id);
        if (idx !== -1) {
            offTasks[idx].status = status;
            saveOfflineTasks(offTasks);
        }
    }
    fetchTasks();
}

async function deleteTask(id) {
    try {
        await fetch(`${apiBase}/${id}`, { method: 'DELETE' });
    } catch (e) {
        let offTasks = loadOfflineTasks();
        offTasks = offTasks.filter(t => t.id !== id);
        saveOfflineTasks(offTasks);
    }
    fetchTasks();
}

function editTask(id) {
    const task = tasks.find(t => t.id === id);
    if(task) {
        document.getElementById('taskName').value = task.name;
        document.getElementById('taskDate').value = task.date;
        document.getElementById('taskTime').value = task.time;
        editTaskId = task.id;
        const btn = document.querySelector('.add-btn') || document.querySelector('.cyber-btn');
        if (btn) btn.innerText = 'Update Tugas';
    }
}

// --- Mobile Web Notifications & Alarm System ---
let notified30 = new Set();
let notified5 = new Set();

function requestNotificationPermission() {
    if ("Notification" in window && Notification.permission !== "granted") {
        Notification.requestPermission();
    }
}

function playSyntheticBeep() {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    setTimeout(() => osc.stop(), 2000); // 2 sec beep for 5-min warning
}

function checkWebAlarms() {
    if (isElectron) return; // Desktop uses Electron main.js for alarms

    const now = new Date();
    tasks.forEach(task => {
        if (task.status !== 'progress') return;
        const taskTime = new Date(`${task.date}T${task.time}`);
        const diffMins = Math.floor((taskTime - now) / 60000);

        // Mobile Web Notification (30 mins)
        if (diffMins <= 30 && diffMins > 5 && !notified30.has(task.id)) {
            notified30.add(task.id);
            if (Notification.permission === "granted") {
                const notif = new Notification("WARNING: Task Deadline", {
                    body: `30 Minutes left for: ${task.name}. Click to mark success.`,
                    icon: 'https://cdn-icons-png.flaticon.com/512/112/112613.png'
                });
                notif.onclick = () => {
                    updateStatus(task.id, 'success');
                    window.focus();
                };
            }
        }

        // Mobile Web Audio Alarm (5 mins)
        if (diffMins <= 5 && diffMins >= 0 && !notified5.has(task.id)) {
            notified5.add(task.id);
            playSyntheticBeep();
        }
    });
}

// IPC from Electron Main (Play audio on desktop when 5 mins)
if (isElectron) {
    const { ipcRenderer } = require('electron');
    ipcRenderer.on('play-alarm', () => {
        playSyntheticBeep();
    });
    
    ipcRenderer.on('server-ip', (event, ip) => {
        const url = `http://${ip}:3000`;
        const linkElem = document.getElementById('mobileLink');
        if (linkElem) {
            linkElem.innerText = url;
        }
    });
}

async function migrateLegacyData() {
    const legacyTasks = localStorage.getItem('tasks');
    if (legacyTasks) {
        try {
            const parsed = JSON.parse(legacyTasks);
            if (parsed && parsed.length > 0) {
                const now = new Date();
                for (let task of parsed) {
                    let status = 'progress';
                    if (task.completed) {
                        status = 'success';
                    } else {
                        const taskTime = new Date(`${task.date}T${task.time || '23:59'}`);
                        if (now > taskTime) {
                            status = 'failed';
                        }
                    }
                    
                    await fetch(apiBase, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: task.name, date: task.date, time: task.time || '23:59', status })
                    });
                }
                // Clear so it doesn't migrate again
                localStorage.removeItem('tasks');
                localStorage.removeItem('successScore');
                localStorage.removeItem('failedScore');
                console.log("Migration complete!");
            }
        } catch (e) {
            console.error("Migration failed:", e);
        }
    }
}

// Theme management
function toggleTheme() {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme') || 'vibrant';
    const next = current === 'vibrant' ? 'simpel' : 'vibrant';
    html.setAttribute('data-theme', next);
    localStorage.setItem('saved_theme', next);
    const btn = document.getElementById('themeBtn');
    if (btn) {
        btn.innerHTML = next === 'vibrant' ? '✨ Tema: Vibrant' : '☀️ Tema: Simpel';
    }
}

function initTheme() {
    const saved = localStorage.getItem('saved_theme') || 'vibrant';
    document.documentElement.setAttribute('data-theme', saved);
    const btn = document.getElementById('themeBtn');
    if (btn) {
        btn.innerHTML = saved === 'vibrant' ? '✨ Tema: Vibrant' : '☀️ Tema: Simpel';
    }
}

// License System
function showLicenseModal() {
    const currentLicense = localStorage.getItem('license_key');
    if (currentLicense && validateLicense(currentLicense)) {
        alert("🎉 Status Lisensi: PRO (Aktif)\nKode Lisensi Anda: " + currentLicense + "\nTerima kasih telah mendukung pengembangan produk ini!");
        return;
    }
    const input = prompt("Masukkan Kode Lisensi PRO Anda (format: ACT-PRO-XXXX-YYYY):\n\nBelum punya? Silakan beli lisensi resmi di toko kami untuk mengaktifkan sinkronisasi PC & Alarm tanpa batas!");
    if (!input) return;
    
    if (validateLicense(input.trim().toUpperCase())) {
        localStorage.setItem('license_key', input.trim().toUpperCase());
        updateLicenseUI();
        alert("🎉 Lisensi PRO Berhasil Diaktifkan! Selamat menikmati seluruh fitur terbaik Activity Tracker Pro.");
    } else {
        alert("❌ Kode Lisensi tidak valid! Silakan periksa kembali kode Anda atau hubungi admin.");
    }
}

function validateLicense(key) {
    if (!key || !key.startsWith('ACT-PRO-')) return false;
    const parts = key.split('-');
    if (parts.length !== 4) return false;
    const xxxx = parts[2];
    const yyyy = parts[3];
    if (xxxx.length !== 4 || yyyy.length !== 4) return false;
    
    let sum = 0;
    for (let i = 0; i < xxxx.length; i++) {
        sum += xxxx.charCodeAt(i);
    }
    const expectedY = ((sum * 137 + 42) % 10000).toString().padStart(4, '0');
    return yyyy === expectedY;
}

function updateLicenseUI() {
    const badge = document.getElementById('licenseBadge');
    if (!badge) return;
    const currentLicense = localStorage.getItem('license_key');
    if (currentLicense && validateLicense(currentLicense)) {
        badge.innerHTML = "👑 PRO (Aktif)";
        badge.style.background = "var(--success-color)";
    } else {
        badge.innerHTML = "⚡ Aktifkan PRO";
        badge.style.background = "#f59e0b";
    }
}

// Init
window.onload = async () => {
    initTheme();
    updateLicenseUI();
    const statusEl = document.getElementById('netStatus');
    if (statusEl) statusEl.innerText = `● Online (${window.location.hostname})`;
    await migrateLegacyData();
    fetchTasks();
    setInterval(fetchTasks, 10000); // Sync every 10 seconds
    
    if (!isElectron) {
        requestNotificationPermission();
        setInterval(checkWebAlarms, 60000);
    }
};

function exportTasksCSV() {
    if (!tasks || tasks.length === 0) {
        alert('⚠️ Belum ada aktivitas yang dicatat.');
        return;
    }
    let csv = "ID,Deskripsi Tugas,Status,Tanggal,Batas Waktu\n";
    tasks.forEach(t => {
        csv += `"${t.id}","${(t.name||'').replace(/"/g,'""')}","${t.status}","${t.date||''}","${t.time||''}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'WBT-Activity-Tracker.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function downloadActivityApp(platform) {
    const ext = platform === 'windows' ? '.exe' : '.apk';
    const fname = `Activity_Tracker_Pro_Setup${ext}`;
    const content = `WBT Activity Tracker Pro Standalone (${platform.toUpperCase()})\nVersion 3.0\n\nTrack tasks, alarms, and productivity scores locally on desktop or mobile.`;
    const blob = new Blob([content], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fname;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    alert(`💻 Mengunduh Aplikasi Standalone Activity Tracker untuk ${platform.toUpperCase()}!\n\nFile "${fname}" telah disimpan ke perangkat Anda.`);
}
