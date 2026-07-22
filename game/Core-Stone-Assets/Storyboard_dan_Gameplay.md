# Core Stone Defense: Storyboard & Dokumen Mekanika Gameplay

## 1. Latar Cerita (*Lore & Story Concept*)
Sebuah Batu Meteor Aneh Raksasa (**Core Stone Monolith / CSM**) jatuh dari langit dan menancap di pinggiran laut dekat sebuah desa yang tersembunyi di balik hutan. Beberapa hari setelah meteor tersebut jatuh, radiasi energinya membuat hutan gersang menjadi rindang, hewan berevolusi, dan buah-buahan membesar berkali-kali lipat.

Keajaiban energi batu ini terdengar oleh Boss Geng Jahat dari kota terdekat yang berniat menguasai dan merampas CSM tersebut. Karena pemerintah setempat tidak mampu mengamankan desa dengan cepat, seorang Veteran Perang wanita/pria berusia 30 tahun mengambil alih komando pertahanan. 

Di awal pertempuran *(Cutscene Intro)*, Sang Veteran menemukan sebuah bongkahan batu kecil yang identik dengan meteor utama di dekat CSM. Batu kecil ini dinamakan **Mini Core Stone (MCS)**. Sang Veteran memungut dan menyimpannya di dalam tas (*Inventory*). Saat itu, MCS tidak aktif dan dianggap batu biasa.

---

## 2. Definisi Aset Inti: CSM vs MCS
*   **CSM (Core Stone Monolith):** Batu kristal hijau raksasa bercahaya di tepi tebing. Memancarkan energi kehidupan dan menjadi target perampasan truk Boss Geng.
*   **MCS (Mini Core Stone):** Disimpan di dalam tas karakter utama. Ini bukan sekadar batu energi biasa, melainkan pelindung luar dari sebuah **Jam Teknologi Kuno Alien (*Alien Chrono-Controller*)** yang berfungsi sebagai **Kunci (*Key*) pengendali waktu** dan penarik energi dari CSM.

---

## 3. Mekanika Keseimbangan Fase 1: Kekalahan Paksa (*Scripted Loss*)
Game dirancang menggunakan sistem keseimbangan statistik (*Difficulty Gating*). 
*   Di **Hari Pertama**, pemain tidak akan bisa menang menahan serangan Boss Geng Jahat.
*   Pada **Jam 19:00**, gelombang penyerangan datang dipimpin langsung oleh Boss menggunakan mobil bak terbuka (*pickup L300*) bersenjata berat/roket.
*   Meski pangkalan pemain sudah di-*upgrade* maksimal di Hari 1, pertahanan akan hancur dan **Boss berhasil mencuri serta mengangkut CSM ke atas truknya.**

---

## 4. Sistem Monetisasi & *Time-Rewind* (Loop Waktu)
Saat CSM berhasil dibawa kabur, pemain tidak langsung *Game Over*, melainkan masuk ke fase **"Stolen Monolith Screen"**.

1.  **Syarat Lanjut (*Continue*):** Pemain harus membayar sejumlah **Permata (*Gems*)**. Jika Permata tidak cukup, pemain diberikan opsi memainkan **Minigame** khusus untuk mengumpulkan sisa Permata yang dibutuhkan.
2.  **Cutscene Sinematik Pecahnya MCS:** Setelah membayar, Veteran membuka tas. MCS bergetar terang, lapisan batunya pecah, dan memperlihatkan **Jam Alien Chrono-Tech** di dalamnya.
3.  **Pemutaran Waktu (*Time Rewind*):** Veteran menekan tombol pada Jam Alien tersebut. Seketika, CSM yang sedang melaju di atas truk Boss Geng langsung terteleportasi (*time rewind*) kembali ke posisinya semula di pinggir laut! Waktu game menunjukkan pukul **20:00 (malam Hari 1)**.

---

## 5. Konsekuensi Strategis (*Strategic Rebuild*)
Meskipun CSM kembali lewat pemutaran waktu, **kerusakan fisik pada benteng/pagar akibat serangan Boss TIDAK ikut ter-rewind.**
*   Struktur yang hancur tetap hancur.
*   Pemain harus menugaskan **NPC Tukang** untuk memperbaiki struktur tersebut.
*   Biaya perbaikan dipatok sebesar **70% dari harga upgrade normal**. Hal ini memaksa pemain mengatur ekonomi *Gold* dan *Wood* mereka secara lebih cermat.

---

## 6. Mesin *Real-Time Persistence* & *Farming*
Game tidak menggunakan sistem label "Day 1", "Day 2" artifisial, melainkan mengikuti siklus waktu *real-time*.

*   **Jendela Waktu Emas (*Extended Prep Time*):** Karena Boss sudah menyerang pada 19:00 Hari 1 dan baru akan kembali pada 19:00 Hari 2, pemain mendapatkan jendela aman dari jam **20:00 (Hari 1) hingga 18:00 (Hari 2)** untuk bertani materi sebanyak-banyaknya tanpa serangan Boss.
*   **Sumber Daya Tanpa Batas (*Online Action*):** Selama pemain aktif bermain (*Online*), material tidak dibatasi. Pemain mendapat **+1 Gold per Kill** dari membantai preman patroli, serta mengumpulkan *Wood* (potongan kayu) dan *Scrap* (besi) yang jatuh *random* (contoh: pada menit ke 3-5).
*   **Logika *Offline / Idle*:** Saat game ditutup (*Offline*), Gold **tidak** akan bertambah. Ini karena *Gold* murni didapat dari hasil peluru Turret dan Pemain yang mengenai musuh secara langsung.
*   **Pertempuran Akhir Fase 1:** Selama pemain aktif memperkuat pangkalan, saat waktu menunjukkan jam 19:00 berikutnya (Gelombang Boss Ke-2), pertahanan pemain sudah jauh lebih kokoh dan siap menghancurkan truk Boss Geng Jahat!

---

## 7. Karakter & Fraksi
*   **Player & Kawan (NPC Pos Pertahanan):** Veteran Perang (Baju Lusuh Taktis), NPC Tukang (Palu), NPC Penebang (Kapak), NPC Penambang (Beliung), NPC Pemanah (Busur), NPC Perawat (Kotak P3K).
*   **Musuh (Sindikat Boss Jahat):** Boss Geng (Gendut, Rompi Berduri), Anggota Geng 1 (Tanpa Senjata/Kaos Kutang), Anggota Geng 2 (Style Punk), Anggota Geng 3 (Taktis/Bandana).

*Dokumen ini merupakan standar resmi arsitektur mekanika pengembangan Core Stone Defense.*
