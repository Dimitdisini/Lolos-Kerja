# Rincian Lengkap Fitur & Matriks Hak Akses Pengguna: Lolos Kerja

**Dokumen Spesifikasi:** Fitur Produk & Hak Akses Pengguna (*User Tier Matrix*)  
**Platform:** Lolos Kerja (Akselerasi Karir Mahasiswa & Fresh Graduate)  
**Pemilik Bisnis:** Dimitri Ahmad (Group CEO & Technology Architect)  
**Metode Pembayaran:** Dynamic QRIS Nasional (Dukungan Utama: **Livin by Mandiri**, BCA, GoPay, ShopeePay, OVO, DANA)  
**Live URL:** [https://lolos-kerja-seven.vercel.app](https://lolos-kerja-seven.vercel.app)  

---

## 1. Integrasi Pembayaran QRIS Livin by Mandiri
Sistem checkout dirancang menggunakan antarmuka **Dynamic QRIS Standar Nasional** yang kompatibel langsung dengan:
1. **Livin by Mandiri (Fitur QR Bayar):**
   - Nasabah Bank Mandiri cukup membuka aplikasi Livin by Mandiri $\rightarrow$ ketuk ikon **QR Bayar** di layar utama atau sebelum login $\rightarrow$ arahkan kamera ke kode QR di layar laptop/HP.
   - Nominal tagihan (Rp 9.999 / Rp 49.000 / Rp 149.000) dan Order ID (`LK-ORD-...`) sudah terkunci otomatis tanpa perlu input manual.
2. **Aplikasi Pendukung Lainnya:**
   - BCA Mobile / myBCA
   - BRImo, BNI Mobile, CIMB Octo
   - E-Wallet: GoPay, ShopeePay, OVO, DANA, LinkAja

---

## 2. Matriks Hak Akses Pengguna (User Tier Breakdown)

Lolos Kerja membagi pengguna ke dalam **4 Tingkatan Akses (Tier)** untuk memaksimalkan konversi *freemium-to-paid*:

| Fitur Utama | FREE (Dibimbing) | PAKET 24 JAM (Rp 9.999) | DIBANTUIN (Rp 49.000) | DIKERJAIN VIP (Rp 149.000) |
| :--- | :---: | :---: | :---: | :---: |
| **Harga & Durasi** | Gratis Selamanya | Rp 9.999 / 24 Jam | Rp 49.000 / 30 Hari | Rp 149.000 / 30 Hari |
| **Login Google 1-Click** | Ya | Ya | Ya | Ya |
| **Bedah CV ATS (Socratic)** | 3x Analisis | Tak Terbatas (24 Jam) | Tak Terbatas (30 Hari) | Tak Terbatas (30 Hari) |
| **Optimasi Rumus STAR** | Dasar | Ya (STAR Penuh) | Ya (STAR Penuh) | Prioritas Deep Audit |
| **Salin Teks Plain ATS** | Ya | Ya | Ya | Ya |
| **Simulasi Wawancara AI** | 2 Sesi Latihan | Tak Terbatas (24 Jam) | Tak Terbatas (30 Hari) | Tak Terbatas (30 Hari) |
| **Dual Scoring Interview** | Ya (Relevansi & Pacing) | Ya (Detail) | Ya (Detail) | Ya (MNC Prep English) |
| **Katalog Loker (418 Loker)** | Akses Penuh & Filter | Akses Penuh & Filter | Akses Penuh & Filter | Akses Penuh & Filter |
| **Direct LinkedIn Apply** | Ya | Ya | Ya | Ya |
| **Cover Letter AI Generator** | Draf Singkat | Draf Kustom | Draf Kustom + Revisi | Tailored per Perusahaan |
| **Smart Drip Auto-Blast** | Terkunci (Access Gate) | 10 Recruiter | 5 Recruiter | **50 Recruiter (Full Access)** |
| **Laporan Pelacak Bouncing** | Tidak | Dasar | Ya | Laporan Komprehensif |
| **Dukungan Prioritas** | Komunitas | Email Standar | WhatsApp 1x24 Jam | Jalur Khusus Dimitri HQ |

---

## 3. Rincian Utuh Setiap Fitur (Modul demi Modul)

### MODUL 1: BEDAH CV INTERAKTIF (ATS Socratic Guidance)
Dirancang untuk mahasiswa yang sering kebingungan mendeskripsikan pengalaman magang atau organisasi kampus.
- **Input Fleksibel:** Pengguna dapat menempelkan teks mentah draf pengalaman kerja tanpa perlu format baku.
- **ATS Health Score Meter:** Mengkalkulasi skor kesehatan resume (0 – 100%) berdasarkan kepadatan kata kunci teknis, kata kerja aksi (*action verbs*), dan kelengkapan struktur.
- **Socratic Clarification Prompts:** AI tidak langsung membuatkan CV palsu, melainkan mengajukan 3 pertanyaan pemantik cerdas (misal: *"Berapa banyak audiens yang hadir dalam event tersebut?", "Berapa persen efisiensi yang berhasil Anda capai?"*).
- **Generator Rumus STAR Otomatis:** Mengubah kalimat pasif menjadi formula berbobot:
  - *Situation:* Konteks proyek atau masalah operasional.
  - *Task:* Tanggung jawab spesifik yang diemban.
  - *Action:* Langkah konkret atau tools yang digunakan.
  - *Result:* Dampak terukur dalam persentase, angka rupiah, atau jumlah orang.
- **1-Click Copy ATS Plain Text:** Tombol satu kali klik untuk menyalin hasil akhir berformat teks bersih yang siap ditempel ke portal lamaran kerja.

---

### MODUL 2: SIMULASI WAWANCARA SUARA (Dual-Scoring Matrix)
Dirancang untuk menghilangkan kegugupan sebelum panggilan wawancara nyata dengan HRD atau User Manager.
- **Pilihan Bank Pertanyaan Realistis:** Mencakup pertanyaan klasik fresh graduate (*"Ceritakan tentang diri Anda"*, *"Kelemahan terbesar"*, *"Mengapa tertarik di perusahaan ini"*).
- **Mode Dwi-Bahasa (Dual-Language Switcher):**
  - **Bahasa Indonesia:** Untuk persiapan perusahaan nasional, BUMN, dan agensi lokal.
  - **English (MNC Prep):** Untuk persiapan wawancara di perusahaan multinasional (*tech startup / management consulting*).
- **Perekaman Suara Real-Time (Web Speech & Audio API):** Dilengkapi animasi gelombang suara (*waveform meter*) dan penghitung durasi detik.
- **Dual-Scoring Matrix:**
  1. **Skor Relevansi Isi (0 – 100%):** Mengukur seberapa tepat poin jawaban kandidat dalam menjawab inti pertanyaan HR.
  2. **Skor Delivery & Ketenangan (0 – 100%):** Menganalisis kecepatan bicara (*Words Per Minute / WPM*) dan mendeteksi frekuensi kata pengisi (*filler words* seperti *"aaa"*, *"eee"*, *"kayak"*, *"anu"*, *"gitu"*).
- **Umpan Balik Perbaikan:** Menampilkan transkrip jawaban asli kandidat beserta saran kalimat alternatif yang lebih percaya diri dan diplomatis.

---

### MODUL 3: SMART JOB MATCHER (Zero-Scraping 400+ Loker Aktif)
Dirancang agar pelamar tidak perlu berpindah-pindah puluhan tab lowongan kerja di browser.
- **Basis Data 418 Loker Aktif LinkedIn:** Mencakup posisi *Junior* dan *Fresh Graduate* di berbagai sektor (IT & Software, Engineering, Bisnis & Operasional, Marketing, BUMN Trainee).
- **Filter Multi-Kriteria:** Filter instan berdasarkan Kategori Industri, Lokasi (Jakarta, Bandung, Surabaya, Yogyakarta, Bali, Remote WFH), dan Tingkat Pengalaman.
- **Logika Kartu Loker Cerdas:**
  - *Sebelum input CV:* Kartu menampilkan status netral **"Siap Lamarmu"**, daftar **Kualifikasi Utama**, dan **Nilai Tambah** tanpa menampilkan persentase kecocokan palsu.
  - *Setelah input CV:* Sistem mencocokkan kata kunci resume kandidat terhadap deskripsi pekerjaan secara dinamis (68% – 98%).
- **Tautan Langsung 1-Klik:**
  - Tombol **"Lamar Langsung di LinkedIn"** membuka halaman lowongan asli di LinkedIn.
  - Tombol **"Glints"** & **"JobStreet"** membuka pencarian terfilter otomatis (*auto-query*).

---

### MODUL 4: SMART DRIP AUTO-BLAST (Kirim Lamaran Email Otomatis)
Fitur automasi untuk mengirimkan berkas lamaran ke recruiter target dengan teknik anti-spam.
- **Pemilihan Target Recruiter:** Pengguna dapat mencentang loker yang ingin dikirimi lamaran.
- **Generator Cover Letter AI:** Menyusun surat lamaran ringkas, santun, dan menonjolkan keunggulan profil kandidat sesuai lowongan target.
- **Algoritma Smart Drip (Safety Delay):** Pengiriman email dilakukan berjarak (jeda acak 30-90 detik antar email) untuk memastikan domain pengirim bebas dari blacklist atau folder spam (*100% Bebas Bouncing*).
- **Access Gate Protection:** Pengguna tier `FREE` akan diarahkan untuk melakukan upgrade jika kuota pengiriman habis atau terkunci.

---

### MODUL 5: CHECKOUT & SETTLEMENT QRIS DINAMIS
Sistem transaksi instan tanpa perlu transfer manual antar rekening.
- **Pembuatan Order ID Unik:** Setiap klik paket langganan membuat order unik (contoh: `LK-ORD-88231`).
- **Kode QRIS Nasional:** Menampilkan QR code yang siap dipindai oleh semua aplikasi bank dan dompet digital (Livin Mandiri, BCA, GoPay, ShopeePay, DANA, OVO).
- **Hitung Mundur Waktu:** Batas waktu pembayaran 15 menit untuk memastikan validitas pesanan.
- **Aktivasi Otomatis:** Setelah pembayaran berhasil, sesi akun seketika berubah ke status langganan baru tanpa perlu konfirmasi manual via chat admin.

---

### MODUL 6: EXECUTIVE PORTAL ADMIN (Dimitri HQ Command Center)
Portal tersembunyi khusus pemilik platform yang diakses via `#admin` atau shortcut `Cmd + Shift + A`.
- **Dashboard Metrik Finansial:** Menampilkan Total Pendapatan Kotor (Gross Revenue), Jumlah Transaksi Settled, Total Pelamar Terdaftar, dan Total Email Blast Terkirim.
- **Manajemen Transaksi (Orders):**
  - Riwayat lengkap ID pesanan, nama pembeli, paket, nominal tagihan, dan waktu transfer.
  - Tombol **"Kirim Nota"** dan **"Hapus Transaksi"**.
  - Tombol **"Export CSV Transaksi"** untuk pencatatan pembukuan kas.
- **Manajemen Pengguna & Kuota (Full CRUD):**
  - **Tambah:** Mendaftarkan user VIP manual dengan kuota kustom.
  - **Edit:** Mengubah nama, email, tier akun, dan sisa kuota blast.
  - **Kurang/Tambah Kuota:** Tombol cepat `+10` dan `-5` kuota blast per kandidat.
  - **Upgrade:** Mengubah akun free langsung menjadi VIP dengan 1-klik.
  - **Hapus:** Menghapus akun pengguna dari database.
  - **Penyimpanan Permanen:** Data pengguna dan transaksi tersimpan di `localStorage` peramban.
- **Manajemen Katalog Loker (Jobs Management Full CRUD):**
  - Menampilkan 418 loker LinkedIn.
  - Tambah lowongan kerja baru secara manual ke katalog publik.
  - Edit posisi, nama perusahaan, gaji, atau lokasi loker.
  - Hapus loker yang sudah kadaluwarsa.
