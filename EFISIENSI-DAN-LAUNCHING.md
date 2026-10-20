# EFISIENSI & RENCANA LAUNCHING: Lolos Kerja

> Pelengkap [PERBAIKAN-TOTAL.md](PERBAIKAN-TOTAL.md). Dokumen itu membahas apa yang rusak. Dokumen ini membahas **bagaimana produknya dirancang efisien dan bagaimana meluncurkannya**.
> Angka biaya di sini adalah **perkiraan dengan asumsi yang ditulis jelas**. Cek ulang harga resmi tiap layanan sebelum memutuskan.

---

## 1. Inti Produk (dirangkum dari visimu)

**Satu kalimat:** *Unggah CV sekali, lalu sistem merapikannya jadi ATS, menyiapkanmu wawancara, mencarikan lowongan yang cocok, dan mengirim lamaran 30-40 per hari lewat email lengkap dengan CV.*

**Fitur utama = Blast Email.** Tiga modul lain ada untuk membuat blast itu **lebih ampuh**: CV yang bagus → lamaran yang masuk ATS → wawancara siap → lowongan yang tepat sasaran.

### Prinsip desain
1. **Satu sumber kebenaran: Master Profile.** CV diunggah/dibuat satu kali, lalu dipecah jadi data terstruktur (JSON). Semua modul membaca dari sini. Tidak ada input ulang.
2. **Tiap modul menghasilkan sesuatu yang dipakai modul berikutnya.**
3. **Kualitas di atas kuantitas pada blast.** 30 email tepat sasaran lebih bernilai daripada 100 email acak, dan jauh lebih aman dari spam filter.
4. **AI dipakai di titik yang bernilai, murah di titik lain.** Regex/aturan untuk hal sederhana, LLM untuk analisis dan penulisan.

---

## 2. Arsitektur Terpadu

```
                     ┌─────────────────────────────┐
  Unggah CV (PDF/    │        MASTER PROFILE       │
  DOCX/teks) atau ──►│  identitas, pendidikan,     │
  isi formulir       │  pengalaman (STAR), skill,  │
                     │  target role, lokasi,       │
                     │  ekspektasi gaji, bahasa    │
                     └───────┬───────┬───────┬─────┘
                             │       │       │
             ┌───────────────┘       │       └────────────────┐
             ▼                       ▼                        ▼
      [1] CV STUDIO           [3] LOWONGAN              [2] WAWANCARA
  analisis ATS, perbaikan,   cocokkan profil ↔ loker   pertanyaan dari CV +
  ekspor PDF ATS             skor match, skill gap     loker, skor jawaban
             │                       │                        │
             └──────────────┬────────┘                        │
                            ▼                                 │
                     [4] AUTO-BLAST  ◄────────────────────────┘
          pilih loker ber-email → cover letter personal → PDF CV terlampir
          → antrean harian 30-40 → status terkirim/bounce/balasan
```

### Tabel database inti (Supabase)
| Tabel | Isi |
|---|---|
| `profiles` | akun, tier, `tier_expires_at`, kuota harian |
| `cv_documents` | file asli, teks hasil ekstraksi, `master_profile` (JSON), versi ATS, skor |
| `jobs` | hasil scraping: judul, perusahaan, lokasi, level, jurusan, `apply_email`, `apply_url`, `posted_at`, `expires_at`, `source`, `hash` (anti-duplikat) |
| `job_matches` | `user_id`, `job_id`, skor match, alasan, skill gap |
| `applications` | lamaran terkirim: loker, subjek, isi, status (`queued/sent/failed/bounced/replied`), waktu |
| `interview_sessions` | pertanyaan, transkrip, skor, saran, tanggal |
| `email_events` | webhook dari penyedia email (delivered, bounced, complaint, opened/replied) |
| `scrape_requests` | permintaan user untuk posisi baru |
| `payments` | order, status, signature gateway |

---

## 3. Spesifikasi Per Modul (yang masih kurang)

### 3.1 CV Studio

**Input yang harus didukung**
- PDF teks, DOCX, TXT, atau isi formulir. PDF hasil scan: deteksi dan tawarkan OCR (atau minta ketik manual).
- CV yang belum ATS (dua kolom, tabel, desain Canva): sistem membaca isinya lalu menyusun ulang ke format 1 kolom.

**Alur**
1. **Ekstrak** teks → LLM memecahnya jadi `master_profile` JSON (nama, kontak, pendidikan, pengalaman, skill, sertifikat, bahasa).
2. **Audit ATS** (campuran aturan + LLM):
   - Aturan: ada email/telepon, heading standar, panjang ≤ 1-2 halaman, tidak ada tabel/gambar, format tanggal konsisten.
   - LLM: kekuatan bullet, ada tidaknya angka/dampak, kecocokan kata kunci terhadap **role target** (bukan kamus tetap 5 role seperti sekarang).
3. **Perbaikan**: tiap bullet diberi versi STAR. **User menyetujui/menolak** satu per satu (jangan menulis fakta yang dikarang AI; jika angka tidak ada, AI bertanya).
4. **Edit langsung** di pratinjau. Perubahan tersimpan sebagai versi (bisa kembali).
5. **Ekspor PDF** sungguhan (teks bisa diseleksi, 1 kolom). PDF ini otomatis jadi lampiran blast.
6. **Varian per role**: satu Master Profile bisa menghasilkan beberapa versi CV (misal "Data Analyst" dan "Business Analyst") yang dipakai blast sesuai loker.

**Yang belum ada sekarang:** ekstraksi terstruktur, varian per role, riwayat versi, PDF asli, OCR, aturan anti-fabrikasi.

### 3.2 Wawancara (mengambil data dari CV)

**Pertanyaan dibuat dari tiga sumber**
1. **CV user**: "Di magang di X kamu menulis menurunkan waktu proses 30%. Bagaimana caranya?"
2. **Loker target**: kualifikasi di deskripsi loker → pertanyaan teknis/perilaku yang relevan.
3. **Bank pertanyaan umum**: perkenalan diri, kelemahan, alasan melamar, ekspektasi gaji.

**Penilaian (ganti yang sekarang berbasis hitung kata)**
| Aspek | Cara |
|---|---|
| Relevansi isi | LLM menilai jawaban terhadap pertanyaan + rubrik STAR, memberi alasan dan contoh perbaikan |
| Konsistensi dengan CV | Jawaban tidak boleh bertentangan dengan Master Profile (misal klaim angka berbeda) |
| Delivery | WPM (dari durasi rekaman sungguhan), filler murni (aaa, eee, hmm, um), jeda panjang |
| Bahasa | Mode ID/EN; untuk EN, nilai tata bahasa dan kosakata |

**Fitur yang belum ada dan layak ditambah**
- Mode **simulasi penuh** (5-7 pertanyaan berurutan, ada pertanyaan lanjutan dari jawaban sebelumnya).
- Rekam audio disimpan (opsional) supaya user bisa mendengar ulang.
- **Riwayat dan grafik progres** antar sesi.
- Tombol **"Latihan untuk loker ini"** di kartu loker.
- Template jawaban model yang memakai **data CV user sendiri**, bukan contoh umum.
- Batas sesi per tier (Free 2 sesi) yang dicek di server.
- Fallback untuk peramban tanpa Speech API (ketik jawaban).
- Tips tahap lanjutan: wawancara user/teknis, negosiasi gaji, pertanyaan balik ke HR.

**Hemat biaya:** transkripsi pakai Web Speech API di peramban (gratis). Hanya teks transkrip yang dikirim ke LLM.

### 3.3 Lowongan & Scraping

**Sekarang:** 1 sumber (LinkedIn via Apify), dijalankan manual, data tertanam di HTML, tanpa kedaluwarsa, level tidak difilter.

**Target:**
| Aspek | Rancangan |
|---|---|
| Sumber | LinkedIn (Apify), Glints, JobStreet, Kalibrr, situs karier BUMN/Kemnaker, **dan** loker yang mencantumkan email HRD (grup/komunitas, situs karier) |
| Jadwal | Terjadwal 1-2×/hari (GitHub Actions cron atau Vercel Cron). Bukan manual |
| Pipeline | scrape → bersihkan → **deduplikasi** (hash `judul+perusahaan+lokasi`) → klasifikasi (role, level, jurusan, bidang) → ekstrak email/URL lamaran → simpan |
| Kedaluwarsa | `expires_at = posted_at + 30 hari`; loker lama otomatis disembunyikan |
| Level | Buang loker `Head/Director/VP/Manager/Senior` dari katalog fresh graduate (contoh sekarang: "Head of Risk Management" masih lolos) |
| Email apply | Ambil dari deskripsi loker atau halaman karier resmi. **Jangan ditebak.** Jika tidak ada, tandai `apply_via = portal` |
| Validasi email | Cek format + MX record sebelum masuk antrean blast |
| Permintaan user | "Minta scrape posisi X" masuk tabel `scrape_requests`, diproses batch, user diberi notifikasi |
| Biaya | Apify ≈ $0,002 per loker (angka dari dokumenmu). Batasi anggaran bulanan dan lacak per run |

**Catatan jujur:** sebagian besar loker besar (LinkedIn/Glints) **tidak menampilkan email HRD**. Pasokan loker yang bisa di-blast lewat email jauh lebih sedikit dari total katalog. Untuk 30-40 email per hari per orang, kamu butuh sumber loker yang memang berbasis email. Pengukuran pertama yang penting: **berapa persen loker hasil scraping punya email apply?** Ukur ini sebelum menjanjikan angka ke teman atau pembeli.

### 3.4 Auto-Blast (fitur utama)

**Alur harian**
1. Sistem menyusun **antrean rekomendasi** tiap hari: loker ber-email, skor match ≥ ambang (misal 60%), belum pernah dilamar, sesuai role/lokasi/level.
2. User meninjau (bisa **Setujui Semua** atau hapus satu-satu). Pratinjau cover letter per loker.
3. Sistem mengirim **terjadwal sepanjang hari** (bukan sekaligus), dengan jeda acak dan jam kerja (misal 08:00-17:00 WIB).
4. Tiap email: cover letter personal (nama HRD/perusahaan/posisi, 2-3 poin paling relevan dari CV) + **PDF CV versi role yang cocok sebagai lampiran**.
5. Status dilacak: terkirim, gagal, bounce, dibalas. Dashboard menampilkan progres harian dan balasan masuk.

**Pengaturan pengiriman**
| Hal | Rekomendasi |
|---|---|
| Penyedia | **Fase launching:** Resend/Postmark/SES dari domain sendiri (`lamaran@loloskerja.id`), `Reply-To` = email user. **Fase lanjut:** kirim dari Gmail user sendiri lewat OAuth (deliverability terbaik, balasan masuk ke inbox user) |
| Autentikasi domain | SPF, DKIM, DMARC wajib. Tanpa ini email masuk spam |
| Pemanasan domain | Mulai 10-15/hari/domain, naik bertahap selama 2-3 minggu |
| Batas harian | Default 30, maksimal 40 per user. Total domain dijaga di bawah batas penyedia |
| Anti-spam | Satu perusahaan maksimal 1 email per 30 hari per user, tanpa tautan berlebihan, tautan berhenti berlangganan, isi unik per email (bukan template identik) |
| Penanganan bounce | Alamat bounce masuk daftar blokir global |
| Lampiran | PDF kecil (< 300 KB) |
| Kuota | Dikurangi **di server hanya jika sukses terkirim** |

**Risiko yang harus dibicarakan jujur dengan teman/pembeli**
- Email dingin ke HRD tidak menjamin dibalas. Jangan menjanjikan "pasti dipanggil".
- Jika banyak penerima menandai spam, domain pengirim rusak dan **semua pengguna** kena dampaknya. Karena itu pemilihan loker harus ketat dan volume dibatasi.
- Mengirim ke alamat yang tidak diminta bisa bersinggungan dengan UU PDP. Gunakan alamat yang dipublikasikan untuk keperluan rekrutmen, sediakan cara berhenti, dan jelaskan di Syarat Layanan.
- Gmail OAuth memakai scope sensitif. Aplikasi baru perlu verifikasi Google sebelum dipakai di luar mode uji (dibatasi jumlah penguji).

---

## 4. Efisiensi Teknis dan Biaya

### 4.1 Prinsip hemat
| Area | Cara efisien |
|---|---|
| AI/LLM | Model kecil/cepat untuk ekstraksi dan klasifikasi; model lebih kuat hanya untuk cover letter dan penilaian wawancara. Simpan hasil (cache) supaya CV yang sama tidak dianalisis ulang. Keluaran JSON terstruktur dan batasi token |
| Transkripsi | Web Speech API di peramban (gratis) |
| Skor match loker | Hitung **sekali** per pasangan (user, loker) di server, bukan tiap render di klien. Mulai dengan kecocokan kata kunci/embedding murah, LLM hanya untuk shortlist |
| Scraping | Jadwal tetap, deduplikasi sebelum klasifikasi, hanya proses loker baru |
| Email | Antrean server, kirim bertahap, jangan retry tanpa batas |
| Frontend | Pecah file 936 KB, muat data loker dari JSON/API dengan paginasi, build Tailwind (hapus CDN) |
| Hosting | Vercel (gratis/murah) + Supabase (gratis/murah) cukup untuk ratusan pengguna awal |

### 4.2 Model biaya per pengguna aktif (isi dengan harga resmi)

```
biaya_user_per_bulan =
    (jumlah_analisis_CV   × biaya_per_analisis)
  + (jumlah_sesi_wawancara × biaya_per_sesi)
  + (email_per_hari × 30  × biaya_per_email)
  + (cover_letter_per_email × email_per_hari × 30 × biaya_per_cover_letter)
  + porsi biaya scraping + biaya payment gateway (persentase dari harga)
```

Asumsi contoh untuk dihitung ulang: 3 analisis CV, 4 sesi wawancara, 30 email/hari × 20 hari kerja (=600 email) pada paket VIP. **Komponen terbesar kemungkinan cover letter AI dan email**, bukan analisis CV. Langkah praktis: jalankan 5-10 pengguna uji, catat pemakaian token dan email sebenarnya, lalu hitung biaya riil per pengguna sebelum menetapkan harga.

### 4.3 Efisiensi kerja (untukmu)
- Kerjakan **satu alur vertikal tipis dulu** (lihat Bagian 6, MVP), jangan memoles semua modul bersamaan.
- Pakai layanan siap pakai (Supabase Auth, Resend, gateway pembayaran) daripada membangun sendiri.
- Setiap sprint punya satu hasil yang bisa dipakai teman, bukan daftar fitur setengah jadi.

---

## 5. Harga dan Paket (menyesuaikan visi blast)

Paket sekarang: Free, Rp 9.999 (24 jam), Rp 49.000, Rp 149.000. Saran penyesuaian agar nilai tiap paket jelas dan sesuai biaya:

| Paket | Harga | Isi yang disarankan |
|---|---|---|
| **Gratis** | Rp 0 | 1 analisis CV, 2 sesi wawancara, lihat katalog loker, ekspor CV (watermark), **tanpa blast** |
| **24 Jam** | Rp 9.999 | Analisis CV tak terbatas, ekspor PDF ATS tanpa watermark, 10 email blast |
| **Bulanan (Dibantuin)** | Rp 49.000 | Semua modul CV dan wawancara, blast **10/hari**, ±30 hari |
| **VIP (Dikerjain)** | Rp 149.000 | Blast **30-40/hari** terjadwal otomatis, antrean rekomendasi harian, varian CV per role, laporan balasan |

Catatan:
- Selisih kuota blast antara 49 ribu (5 recruiter di dokumen lama) dan 149 ribu (50) terlalu kecil untuk visi "30-40 per hari". Ubah jadi **kuota harian**, bukan total sekali pakai.
- Hitung margin dulu (Bagian 4.2). Jika biaya per pengguna VIP mendekati Rp 149.000, naikkan harga atau turunkan batas harian.
- Tawarkan **harga teman/beta** di fase awal, lalu naik setelah ada bukti hasil.

---

## 6. Rencana Launching

### Fase 0: Bersih-bersih (wajib, sebelum ada orang lain pakai)
Selesaikan **Sprint 1 di PERBAIKAN-TOTAL.md**: auth sungguhan, RLS, hapus admin via PIN, hapus simulasi bayar, matikan webhook email lama.
**Selesai jika:** tidak ada celah login, tidak ada VIP gratis, tidak ada email bocor.

### Fase 1: MVP vertikal (±2-3 minggu)
Satu alur nyata dari ujung ke ujung, untuk satu bidang saja (misal bisnis/admin atau IT):
1. Unggah CV → ekstraksi → audit ATS → perbaikan → **PDF ATS asli**
2. Loker ber-email dari 1-2 sumber (sudah dicek email-nya)
3. Match sederhana + cover letter AI
4. **Kirim 10-20 email/hari** lewat Resend dari domain sendiri, PDF terlampir, status nyata
5. Pembayaran manual dulu (transfer + konfirmasi admin) jika gateway belum siap, tapi **verifikasi lewat dashboard admin sungguhan**, bukan tombol simulasi

**Selesai jika:** satu orang bisa dari unggah CV sampai email diterima HRD dengan lampiran benar, tanpa bantuanmu.

### Fase 2: Beta tertutup, teman dekat (±2 minggu)
- 10-20 teman, gratis atau harga teman.
- Catat: tingkat selesai onboarding, jumlah email terkirim, **bounce rate, spam complaint, balasan masuk, undangan wawancara**, dan feedback tiap modul.
- Perbaiki berdasarkan data, bukan tebakan.

**Target pemicu lanjut (contoh, sesuaikan):**
| Metrik | Batas sehat |
|---|---|
| Bounce rate | < 3% |
| Spam complaint | < 0,1% |
| Email terkirim sukses | > 95% |
| Pengguna yang menyelesaikan CV + blast pertama | > 60% |
| Minimal 1 balasan/undangan wawancara per ±3-5 pengguna | indikasi nilai nyata |

### Fase 3: Tambah kedalaman (±3-4 minggu)
- Modul wawancara penuh (pertanyaan dari CV + loker, riwayat, simulasi berurutan)
- Scraping terjadwal multi-sumber, kedaluwarsa, validasi email
- Dashboard pengguna (CV, loker tersimpan, lamaran, balasan)
- Payment gateway QRIS dinamis + webhook + masa aktif

### Fase 4: Soft launch (publik terbatas)
- Buka lewat komunitas kampus/alumni/Instagram/TikTok, kuota pendaftar dibatasi (waitlist).
- Halaman **Kebijakan Privasi, Syarat Layanan, kebijakan email**, dan persetujuan penyimpanan CV.
- Monitoring: Sentry, dashboard reputasi domain email, alert saat bounce naik.
- Dukungan: WhatsApp/Email dengan jam layanan jelas.

### Fase 5: Skala
- Gmail OAuth (ajukan verifikasi Google lebih awal karena butuh waktu)
- Lebih banyak bidang dan sumber loker
- Program referral (undang teman → bonus kuota)
- Kemitraan kampus/career center
- Pertimbangkan aplikasi mobile (file Flutter di folder proyek bisa jadi titik awal)

### Garis waktu ringkas
```
Minggu 1      : Fase 0 (keamanan)
Minggu 2-4    : Fase 1 (MVP vertikal)
Minggu 5-6    : Fase 2 (beta teman)
Minggu 7-10   : Fase 3 (kedalaman + pembayaran)
Minggu 11-12  : Fase 4 (soft launch)
Setelahnya    : Fase 5 (skala)
```
(Perkiraan untuk satu orang pengembang paruh waktu. Dengan bantuan, bisa lebih cepat.)

---

## 7. Strategi Pemasaran Awal (ringan dan murah)

- **Bukti sosial nyata:** testimoni dan angka dari beta teman ("X orang dapat panggilan interview"), bukan statistik "94%" yang tidak ada sumbernya.
- **Konten:** before/after CV (dengan izin), tips ATS, simulasi wawancara singkat di TikTok/Instagram/LinkedIn.
- **Demo gratis tanpa login:** cek skor ATS satu CV, lalu minta daftar untuk perbaikan penuh. Ini pintu konversi terbaik.
- **Harga teman + referral** untuk dorongan awal.
- **Kanal:** grup alumni, komunitas fresh graduate, BEM/UKM, career center kampus.

---

## 8. Risiko dan Cara Mengelolanya

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Domain email masuk blacklist | Semua blast gagal | Autentikasi domain, pemanasan, batas harian, validasi email, daftar blokir bounce, pantau reputasi |
| Sedikit loker punya email apply | Janji "30-40/hari" tidak terpenuhi | Ukur persentase lebih dulu; tambah sumber berbasis email; jujur soal batas |
| Biaya AI melebihi pendapatan | Rugi | Cache, model kecil, batas per tier, hitung biaya riil di beta |
| Data CV bocor | Hilang kepercayaan, masalah hukum | RLS ketat, enkripsi saat disimpan, hapus data sesuai permintaan, privasi jelas |
| AI mengarang pengalaman di CV | Pengguna dirugikan saat diverifikasi | Wajib persetujuan user per perubahan; AI bertanya, bukan mengisi angka |
| Pembayaran diklaim tanpa transfer | Rugi | Verifikasi webhook gateway/konfirmasi admin |
| Terlalu banyak fitur setengah jadi | Produk tak terpakai | MVP vertikal dahulu, fitur lain menyusul berdasarkan data beta |
| Ketergantungan satu sumber scraping | Katalog kosong jika sumber berubah | Banyak sumber, pantau jumlah loker harian |

---

## 9. Checklist Siap Launching

**Produk**
- [ ] CV unggah → ATS → PDF asli bekerja untuk PDF, DOCX, dan CV non-ATS
- [ ] Wawancara memakai data CV dan loker, skor dinilai terhadap pertanyaan
- [ ] Loker terjadwal, bebas duplikat, ada kedaluwarsa, level fresh grad tersaring
- [ ] Blast: lampiran CV benar, status nyata, kuota harian dicek server
- [ ] Dashboard pengguna menampilkan semua aktivitas dalam satu tempat

**Teknis**
- [ ] Auth, RLS, dan admin berbasis role (Fase 0)
- [ ] Pembayaran terverifikasi server
- [ ] Antrean email di server; SPF/DKIM/DMARC aktif
- [ ] Backup database, monitoring error, alert bounce

**Bisnis dan hukum**
- [ ] Margin per paket dihitung dari data beta
- [ ] Kebijakan Privasi, Syarat Layanan, kebijakan email, persetujuan data
- [ ] Klaim pemasaran hanya yang bisa dibuktikan
- [ ] Rencana dukungan pengguna (siapa membalas, jam berapa)

**Peluncuran**
- [ ] Beta teman selesai dan metrik sehat
- [ ] Waitlist dan batas pendaftar harian
- [ ] Materi konten dan testimoni siap
