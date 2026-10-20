# PERBAIKAN TOTAL: Lolos Kerja (Dims Career Copilot)

> Hasil audit kode `index.html` (20.345 baris), `google-apps-script-webhook.js`, `supabase-schema.sql`, `vercel.json`, `scrape-apify.js`, dan dokumen README.
> Tanggal audit: 20 Oktober 2026. Referensi baris mengacu ke `index.html` versi saat ini.

---

## 0. Ringkasan Eksekutif

Aplikasi sudah punya alur UI yang lengkap, tapi **sebagian besar "fitur" masih simulasi di sisi browser** dan belum terhubung ke backend sungguhan. Temuan utama:

| # | Temuan | Dampak |
|---|--------|--------|
| 1 | Login Supabase **tidak memeriksa password sama sekali** (`index.html:18467`) | Siapa pun bisa masuk ke akun siapa pun, termasuk owner |
| 2 | Admin bisa dibuka lewat `#admin`, PIN hardcoded (`1908`, `lord`, `admin`, `dummy`), atau nama mengandung "dimitri" (`:13154-13163`) | Command Center terbuka untuk publik |
| 3 | Tombol "Simulasi Bayar Berhasil" langsung upgrade ke VIP tanpa pembayaran (`:18628`) | Semua fitur berbayar gratis |
| 4 | RLS Supabase `USING (true)` untuk semua tabel (`supabase-schema.sql:101-114`) | Siapa pun dengan anon key bisa baca/ubah/hapus semua user, transaksi, log |
| 5 | Webhook Apps Script tanpa autentikasi, mengirim email lewat Gmail pemilik | Siapa pun bisa memakai Gmail kamu untuk kirim email ke siapa saja |
| 6 | Blast email: CV **tidak pernah dilampirkan**, log "[250 OK]" palsu, alamat HRD ditebak (`careers@<nama>.com`) | Email terkirim tanpa CV, banyak bounce, domain pengirim bisa diblokir |
| 7 | Tidak ada AI sungguhan. Semua analisis berupa regex dan template | Klaim "AI", "Socratic", "halusinasi ChatGPT" menyesatkan |
| 8 | Kuota dan tier hanya di `localStorage`, tanpa masa berlaku | Bisa diedit lewat DevTools, paket 24 jam tidak pernah kedaluwarsa |
| 9 | Beberapa class Tailwind tidak ada (`text-2xs`, `shadow-2xs`, `py-0.2`, `active:scale-98`) | Tampilan tidak sesuai desain |
| 10 | Satu file raksasa 20 ribu baris, plus belasan skrip `patch_*.js` di root | Sulit dirawat, mudah muncul bug baru |

**Urutan kerja yang disarankan:** Fase 1 (keamanan, wajib sebelum ada pengguna nyata) → Fase 2 (menyambungkan fitur) → Fase 3 (UI) → Fase 4 (kualitas dan struktur kode).

---

## FASE 1: Keamanan dan Fondasi (Prioritas P0)

### 1.1 Autentikasi sungguhan
**Masalah**
- `handleEmailLogin` (`:18467-18479`): jika user ada di Supabase, `matchedUser` langsung dibuat tanpa cek password.
- Registrasi menyimpan `password` **plain text** di `adminState.users` dan `localStorage` (`:18398`).
- Akun default `password123` ikut tertanam di kode (`:18699-18701`).
- Sesi hanya `localStorage.lolos_kerja_user` yang bisa diedit manual.

**Perbaikan**
- Pakai **Supabase Auth** (`signUp`, `signInWithPassword`, `signInWithIdToken` untuk Google). Hapus semua penyimpanan password sendiri.
- Hapus `defaultAdminUsers` berisi password, dan hapus fallback login lokal.
- Ambil profil dari tabel `profiles` yang di-link ke `auth.users.id`, bukan dari email di `localStorage`.
- Buang pengecekan `email === 'dimitriahmad000@gmail.com'` di klien. Role owner/admin disimpan di database, bukan di JS.

### 1.2 Admin / Command Center
**Perbaikan**
- Hapus: hash `#admin`/`#lord`, shortcut rahasia, `prompt()` PIN, dan cek `name.includes('dimitri')`.
- Admin hanya aktif jika `profiles.role IN ('admin','owner')` **dan** dicek ulang oleh RLS di server.
- Pindahkan admin ke halaman terpisah (`/admin`) yang tidak dimuat untuk pengguna biasa.
- Hapus data palsu (`defaultAdminTransactions`, `defaultAdminScrapingRequests`) dan log terminal palsu (`:2495`, `:19011`). Dashboard harus menampilkan data nyata atau keadaan kosong.

### 1.3 Pembayaran
**Masalah:** `simulatePaymentSuccess()` bisa dipanggil siapa saja. QRIS adalah gambar statis (`assets/qris-official.png`), jadi tidak ada verifikasi.

**Perbaikan**
- Integrasi payment gateway dengan QRIS dinamis dan webhook (Midtrans, Xendit, atau Duitku).
- Alur: klien minta order ke serverless function → gateway buat QRIS → gateway kirim webhook ke server → server memverifikasi signature lalu update `transactions` dan `users.tier` + `tier_expires_at`.
- Hapus tombol simulasi dari build produksi (atau sembunyikan di balik `localhost` saja).
- Tambah kolom `tier_expires_at`, dan cek kedaluwarsa di server.
- Perbaiki bug tier: `handleSelectPlan` hanya dipanggil untuk Dibantuin dan VIP (`:1952`, `:1998`). **Paket 24 Jam (Rp 9.999) tidak punya tombol beli**, padahal banner dan dokumen menjualnya.
- `simulatePaymentSuccess` memberi `DIBANTUIN` untuk semua selain VIP dan tidak menambah kuota. Seragamkan dengan matriks di dokumen (24 Jam = 10, Dibantuin = 5, VIP = 50).

### 1.4 Row Level Security Supabase
**Perbaikan** (ganti policy `USING (true)`):
```sql
-- profil: user hanya akses miliknya
create policy "own profile read"   on public.users for select using (auth.uid() = id);
create policy "own profile update" on public.users for update using (auth.uid() = id)
  with check (auth.uid() = id and tier = (select tier from public.users where id = auth.uid())
              and blast_quota = (select blast_quota from public.users where id = auth.uid()));
-- transaksi & blast_logs: user hanya baca miliknya, tulis lewat server (service role)
create policy "own tx read"   on public.transactions for select using (user_id = auth.uid());
create policy "own blast read" on public.blast_logs   for select using (user_id = auth.uid());
-- admin: lewat fungsi is_admin() berbasis kolom role
```
- Kolom `tier`, `blast_quota`, `role` **tidak boleh** bisa di-update dari klien. Ubah lewat fungsi server (`security definer`) atau Edge Function.
- Aktifkan Realtime hanya pada tabel yang aman. Saat ini semua tabel disiarkan ke semua klien.
- Tambah tabel `cv_documents` (isi CV per user), `interview_sessions`, `applications`, dan `scrape_requests`.

### 1.5 Webhook Google Apps Script (open relay email)
**Masalah:** `doPost` menerima siapa saja, lalu `GmailApp.sendEmail` ke `recruiterEmail` mana pun. URL webhook ada di kode publik (`:18091`). Header `Content-Type: text/plain` + `no-cors` berarti klien tidak bisa membaca hasil, jadi sukses/gagal tidak pernah diketahui.

**Perbaikan**
- Hentikan pengiriman email dari Apps Script. Pakai **Resend / Postmark / Amazon SES** lewat Edge Function Supabase atau Vercel Function, dengan SPF, DKIM, dan DMARC pada domain sendiri.
- Verifikasi JWT Supabase di server sebelum mengirim, lalu cek dan kurangi kuota **di server** (`decrement_blast_quota` sudah ada di schema, tapi tidak dipakai).
- Batas Gmail gratis hanya ~100 email per hari, dan semua lamaran user akan terkirim "dari" akun Gmail kamu. Ini tidak akan skalabel.
- Jika Sheets tetap dipakai untuk backup, tambah token rahasia di payload dan validasi di `doPost`.
- Tambah `try/catch` terpisah supaya variabel `emailSubject`/`emailBody` tidak `undefined` di blok fallback `MailApp` (`:117`, `:127`).

### 1.6 Rahasia dan konfigurasi
- `scrape-apify.js:10` memuat token Apify sebagai fallback. File ini **belum ter-commit** (status git `??`), jadi aman di riwayat saat ini. Tetap **rotasi token** dan hapus fallback-nya. Pastikan `scrape-apify.js` tidak pernah di-`git add`.
- Tambah ke `.gitignore`: `.env`, `scrape-apify.js` (atau pindah ke `scripts/` dengan env), `apify-raw-jobs.json`, `new-apify-scraped-jobs.json`, `hasil_test_cv/`, `dospem-reverse-engineering/`.
- Kunci Supabase `sb_publishable_...` memang boleh publik, **asal RLS benar** (1.4). Hapus form "Supabase Config" dari halaman admin (`:2226-2230`), karena key tidak boleh diganti dari UI.
- Tambah `Content-Security-Policy` dan `Referrer-Policy` di `vercel.json`. `X-XSS-Protection` sudah usang dan bisa dihapus.

### 1.7 XSS
`innerHTML` dipakai 45 kali, tapi `escapeHtml` hanya 18 kali. Contoh rawan: `renderJobs` (`:15240` menyisipkan `query` mentah), `status.innerHTML` yang berisi `file.name` (`:17414`, `:14689`), nama/email user di tabel admin, log blast (`appendBlastLog` berisi `item.company`).
**Perbaikan:** audit semua `innerHTML`, ganti dengan `textContent` atau bungkus setiap data dinamis dengan `escapeHtml()`. Nama file yang diunggah user wajib di-escape.

---

## FASE 2: Menyambungkan Fitur (yang Sekarang Belum Terhubung)

### 2.1 Modul CV (Bedah CV ATS)

| Masalah | Lokasi | Perbaikan |
|---|---|---|
| Skor ATS hanya regex; `formatScore` selalu 95 | `:14370` | Hitung format sungguhan: ada kontak, section standar, panjang halaman, tidak ada tabel/kolom. Skor kata kunci hanya punya kamus untuk **5 dari ±30 role**, sisanya jatuh ke `business-analyst` (`:14404`) |
| Angka terdeteksi mencakup kata "hari", "jam", "divisi" tanpa angka | `:14373` | Hitung hanya angka asli (`\d`) |
| Upload menerima `.doc/.docx` tapi hanya PDF.js yang dimuat | `:984`, `:319` | Tambah `mammoth.js` untuk `.docx`, hapus `.doc`, atau batasi ke PDF/TXT. Beri pesan jelas jika PDF berupa hasil scan (tanpa teks) |
| "Google Drive" hanya `prompt()` lalu mengisi **CV preset contoh** | `:13632-13652` | Hapus tombolnya, atau implementasi Google Picker API. Jangan pernah menampilkan "berhasil disinkronkan" untuk data palsu |
| "Simpan ke Google Drive" sebenarnya mengunduh file **.html** | `:14646-14666` | Ganti nama jadi "Unduh CV". Hasilkan **PDF sungguhan** (html2pdf / jsPDF atau render di server) |
| CV tidak tersimpan per user | `syncUserCVToCloud` | Simpan ke tabel `cv_documents`, dan muat ulang saat login di perangkat lain |
| Pilihan role di CV mengubah target blast secara diam-diam | `:14422-14427` | Tampilkan di UI bahwa target blast ikut berubah, atau biarkan user memilih sendiri |
| Dua mode input (Formulir, Unggah) lalu tombol berbeda memanggil fungsi yang sama (`applyStarOptimization`) | `:1036`, `:1062` | Satukan satu alur: **Input → Analisis → Edit → Ekspor** |
| `div.hidden` berisi "compatibility anchors for testing" | `:943-957`, `:1071-1075` | Hapus elemen hantu dan kode yang merujuknya (sisa fitur chat/typeform lama) |

**AI sungguhan (pilihan yang paling berdampak):** buat satu endpoint serverless `/api/cv-analyze` yang memanggil LLM (Claude API) dengan prompt STAR dan keluaran JSON terstruktur (skor, saran, kalimat hasil). Simpan API key di environment Vercel, jangan di klien. Beri rate-limit per user sesuai tier. Pertahankan skor regex sebagai fallback offline.

### 2.2 Modul Wawancara

| Masalah | Lokasi | Perbaikan |
|---|---|---|
| "Skor Relevansi" **tidak melihat pertanyaan sama sekali**. Dasarnya jumlah kata + ada angka + kata kunci hasil | `:15106-15110` | Nilai terhadap pertanyaan dan rubrik STAR (via LLM), atau minimal cek keselarasan kata kunci pertanyaan |
| "mungkin", "like", "actually" dihitung sebagai kata pengisi | `:15047`, `:15053`, `:15056` | Pisahkan "filler murni" (aaa, eee, hmm, um, uh) dari "hedging words" dan beri bobot berbeda |
| Durasi: jika tidak merekam, WPM dihitung dari asumsi `kata/2.15` | `:15087` | Jika durasi tidak ada, sembunyikan WPM atau beri label "estimasi" |
| Kuota Free "2 sesi" di dokumen tidak diterapkan di kode | matriks hak akses | Tambah penghitung sesi per user di server, dan tampilkan sisa sesi |
| Hasil sesi tidak tersimpan | `analyzeInterviewAnswer` | Simpan ke `interview_sessions` (pertanyaan, transkrip, skor, tanggal) dan tampilkan grafik progres |
| Pertanyaan tidak terkait dengan loker yang dilamar | `selectCareerCompass` | Tombol "Latihan untuk loker ini" dari kartu loker, yang mengisi pertanyaan sesuai role/perusahaan |
| Speech API hanya Chrome/Safari, tanpa fallback | `:14041` | Deteksi dukungan peramban, tampilkan banner jelas dan jalur ketik manual |

### 2.3 Modul Loker

| Masalah | Lokasi | Perbaikan |
|---|---|---|
| Angka katalog tidak konsisten: "52+" (meta, badge nav), "400+", "418" | `:7`, `:391`, `:1407`, dokumen | Tampilkan jumlah **dinamis** dari `jobs.length` |
| Data loker tertanam di HTML (±10 ribu baris) | `:~2960-13100` | Pindah ke `jobs.json` atau tabel Supabase `jobs`, dimuat dengan fetch + paginasi |
| Tidak ada tanggal kedaluwarsa. Dokumen menyebut "aktif < 30 hari" tapi tidak ada filter | `:19011` | Simpan `posted_at`, `expires_at`; sembunyikan loker lewat 30 hari; cron scraping terjadwal (GitHub Actions / Vercel Cron) |
| Persentase "match" dihitung dari kata kunci lokal | `renderJobs` | Pakai skor dari analisis CV tersimpan; tampilkan alasan match (skill cocok / kurang) |
| Loker tanpa email HRD memakai tebakan `careers@<nama>.com` | `:16102-16113` | **Hapus tebakan.** Hanya gunakan email yang terverifikasi, selain itu arahkan ke "Lamar via portal" |
| Tombol "Kirim via Email" dan "Salin Pitch STAR" berbeda perilaku tanpa penjelasan | `:15341-15360` | Satu tombol utama "Lamar" yang memilih jalur otomatis, dengan label jelas |
| Permintaan "Minta Bot Scrape" masuk `localStorage` admin saja | `:18925` | Simpan ke tabel `scrape_requests` di Supabase, dan beri notifikasi ke user setelah selesai |
| Judul loker tidak sesuai kategori (misal loker "Head of Risk Management" dan "Director of Security" ada di katalog Fresh Graduate) | data JSON | Filter level saat scraping (exclude `Head`, `Director`, `Manager`, `Senior`) dan validasi sebelum masuk katalog |

### 2.4 Modul Blast Email (paling banyak yang tidak nyata)

| Masalah | Lokasi | Perbaikan |
|---|---|---|
| **Lampiran CV tidak pernah terkirim.** `currentBlastCvFile` hanya menyimpan nama, ukuran, tipe. `linkCvToModule4` memakai ukuran palsu `142800` dan `alert` "terlampir sebagai PDF" | `:17405-17416`, `:14674-14697` | Upload file PDF ke Supabase Storage, kirim sebagai attachment (atau tautan terproteksi) lewat penyedia email |
| Log "[250 OK] Email terkirim" ditulis sebelum ada respons server | `:17582` | Tampilkan status berdasarkan hasil nyata dari API (`sent`, `failed`, `bounced`) |
| Kuota dikurangi di klien sebelum email berhasil dikirim | `:17592-17615` | Kurangi kuota di server hanya jika sukses (`decrement_blast_quota`) |
| Jeda 4,5 detik, padahal dokumen menjanjikan 30-90 detik acak | `:17542`, `:17578` | Implementasi antrean di server (Supabase pg_cron / queue) sehingga pengiriman jalan walau tab ditutup |
| Proses blast berhenti jika tab ditutup | `setTimeout` | Pindah antrean ke server |
| Pembungkus gating `startSmartDripBlast = function(){...}` menimpa deklarasi fungsi | `:18680-18696` | Gabungkan pengecekan login/tier ke dalam fungsi aslinya, dan hapus teknik override |
| Gating hanya memeriksa `tier === 'FREE'`. Tidak ada cek kedaluwarsa | `:18685` | Cek `tier_expires_at` di server |
| Email pengirim bisa diisi bebas (`blastSenderEmail`) | `:17610` | Pengirim = akun terverifikasi user; atau kirim dari domain sendiri dengan `Reply-To` user |
| Tidak ada penanganan bounce, balasan, dan unsubscribe | schema | Webhook dari penyedia email → update `blast_logs.status`; kirim hanya ke alamat yang pernah divalidasi |
| Riwayat "Sudah Dilamar" hanya `localStorage` | `saveAppliedJobsHistory` | Simpan di tabel `applications` agar sinkron antar perangkat |
| Cover letter dibuat dari template, bukan AI | `:17418` | Pakai endpoint LLM yang sama dengan modul CV, dengan data CV user dan deskripsi loker |

> **Catatan hukum dan etika:** mengirim massal email ke alamat HRD tanpa persetujuan bisa dianggap spam dan melanggar UU PDP / aturan penyedia email. Batasi ke alamat resmi karier yang dipublikasikan, beri tautan berhenti, dan tetapkan batas harian per pengguna.

### 2.5 Keterhubungan Antar Modul (alur utama yang diinginkan)

Saat ini keempat modul berdiri sendiri dan hanya "tersambung" lewat variabel global. Targetnya satu data user yang sama:

```
Profil user (Supabase)
 ├─ CV tersimpan (cv_documents)  ──► skor ATS + role target
 │        │
 │        ├──► Katalog Loker: match % dan skill gap dari CV nyata
 │        │         │
 │        │         ├──► "Latihan wawancara untuk loker ini"  ──► interview_sessions
 │        │         └──► "Lamar": cover letter dari CV + loker ──► applications
 │        └──► Lampiran PDF otomatis di Blast
 └─ Tier + kuota + masa aktif (server) ──► membatasi fitur di semua modul
```

Perubahan konkret:
1. Satu objek `appState.profile` yang dimuat dari Supabase saat login. Hilangkan duplikasi `currentUser`, `adminState.users`, `localStorage` terpisah.
2. Kartu loker punya aksi: **Lamar**, **Latihan Wawancara**, **Simpan**.
3. Halaman **Dashboard** pengguna: CV terakhir + skor, loker tersimpan, lamaran terkirim + status, sesi wawancara, sisa kuota dan masa aktif.
4. Tab "Panduan Agen" (simulasi multi-agent) dipindah ke halaman "Tentang"/dokumentasi, atau dihapus. Ini visualisasi, bukan fitur, dan menambah beban navigasi.

---

## FASE 3: Perbaikan UI/UX

### 3.1 Bug tampilan (class tidak ada di Tailwind)
Tailwind CDN tidak punya class berikut, jadi **tidak ada efeknya**:

| Class | Jumlah | Ganti dengan |
|---|---|---|
| `text-2xs` | 17 | `text-[10px]` atau `text-xs` (atau daftarkan di `tailwind.config`: `fontSize: {'2xs': '0.625rem'}`) |
| `shadow-2xs` | 24 | `shadow-sm` (atau daftarkan di config) |
| `py-0.2` | 10 | `py-0.5` |
| `active:scale-98` | 2 | `active:scale-[0.98]` |

(`shadow-xs` dan `shadow-2xs` valid di Tailwind v4, tapi CDN yang dipakai adalah v3. Cara paling aman: **pin versi** Tailwind dan lakukan build.)

### 3.2 Tailwind CDN di produksi
`cdn.tailwindcss.com` tidak untuk produksi: lambat, menyebabkan *flash of unstyled content*, dan bergantung pada pihak ketiga. Pakai Tailwind CLI / Vite, hasilkan satu `styles.css` ter-minify. Pin juga versi `@supabase/supabase-js@2` ke versi pasti.

### 3.3 Konsistensi dan kejelasan
- **Pilih satu nama merek.** Dokumen: "Lolos Kerja", README: "Kandidat AI", tab: "Dospem-style", dropdown: "Dilolosin VIP", paket: "Dikerjain VIP". Samakan di seluruh UI, meta, dan README. Hapus label teknis "Lord", "HQ", "Dospem" dari tampilan publik.
- **Nama tier sama di mana-mana:** `FREE`, `FLASH`, `DIBANTUIN`, `VIP` dengan satu pemetaan nama tampilan. Sekarang rumus nama tier diulang di 5 tempat (`:17730`, `:17764`, `:18529`, `:19399`, dll.).
- **Klaim yang tidak bisa dibuktikan** harus diganti: "94% Lolos Screening ATS", "100% Bebas Bouncing", "ChatGPT sering halusinasi". Gunakan klaim yang benar-benar terukur, atau hapus.
- Badge nav dropdown bertuliskan **"52"** untuk loker. Ganti dengan angka dinamis atau ikon.

### 3.4 Navigasi dan mobile
- Menu desktop memakai `group-hover` untuk dropdown, yang tidak bekerja di layar sentuh dan tablet. Ubah jadi klik (`aria-expanded`).
- Bottom nav mobile hanya 5 tab (`:20081-20101`), tidak ada Harga/Profil. Tambah tab **Akun** (profil, paket, sisa kuota).
- Admin tab muncul di navbar untuk siapa pun yang lolos pengecekan lemah. Pindahkan sepenuhnya ke `/admin`.
- Ganti 81 pemanggilan `alert()/confirm()/prompt()` dengan **toast dan modal** yang konsisten. Contoh: PIN admin, "Registrasi Berhasil", "Tautan Google Drive berhasil diverifikasi".
- Tambah **state kosong, loading, dan error** untuk setiap daftar: loker, riwayat lamaran, hasil analisis.
- Aksesibilitas: label untuk input, `aria-label` pada tombol ikon, fokus yang terlihat, kontras teks `text-slate-400` di atas putih (rasio kurang dari 4,5:1), target sentuh minimal 44px (`.touch-target` sudah ada tapi jarang dipakai).
- Sembunyikan CTA yang menipu: tombol "Coba Gratis" membuka modal daftar, padahal teks hero bilang "tanpa registrasi rumit". Izinkan coba satu analisis CV tanpa login.

### 3.5 Halaman CV
- Susun layout menjadi tiga langkah yang jelas (stepper): **1. Isi/Unggah → 2. Skor dan Saran → 3. Pratinjau dan Ekspor**.
- Pratinjau Harvard: tampilkan batas halaman A4 dan indikator "lebih dari 1 halaman".
- Jangan menampilkan "100% Terekstraksi ke ATS" jika ekstraksi hanya sebagian. Tampilkan jumlah kolom yang berhasil terbaca.

### 3.6 Halaman Harga
- Tabel perbandingan paket harus **sama persis** dengan hak akses yang diterapkan server.
- Tambahkan tombol beli untuk Paket 24 Jam.
- Tampilkan sisa waktu aktif dan tanggal kedaluwarsa setelah membeli.

---

## FASE 4: Kualitas Kode dan Struktur Proyek

1. **Pecah `index.html`** (936 KB, 20 ribu baris) menjadi modul:
   ```
   /src
     /pages        (home, cv, interview, jobs, blast, pricing, account)
     /lib          (supabase.js, auth.js, scoring.js, email.js)
     /components   (modal, toast, navbar)
   /api            (serverless: cv-analyze, interview-score, send-blast, payment-webhook)
   /public/jobs.json
   ```
   Pakai Vite (vanilla atau React) agar build, minify, dan impor modul tersedia.
2. **Hapus file duplikat** `Prototipe Karir Copilot.html` (identik dengan `index.html`, ikut ter-commit).
3. **Hapus skrip patch sekali pakai** dari root: `add_*.js`, `patch_*.js`, `refactor_*.js`, `simplify_*.js`, `upgrade_*.js`, `declutter_ui.js`, `redesign_*.js`, `fix_inline_custom_role.js`. Ini sisa pengeditan `index.html` via skrip. Pindahkan yang masih berguna (QA audit, scraper) ke `/scripts`, sisanya hapus (riwayat Git sudah menyimpannya).
4. **Folder `node_modules` (25 MB)** sudah di-ignore. Buat `package.json` supaya dependensi terdokumentasi.
5. **Hindari pola override fungsi** (`const original = fn; fn = function(){}`) dan ganda `textContent` + `innerText` pada setiap update (banyak di `updateScoreUI`).
6. **Hapus kode mati:** `cvModeTextView` yang disembunyikan, `switchPersona`, `loadCVPreset` yang dipakai Drive palsu, dan "compatibility anchors".
7. **Pengujian:** ubah `run-full-qa-audit.js` dan `run-ui-ux-audit.js` jadi tes Playwright, dan jalankan di GitHub Actions setiap push.
8. **Dokumentasi:** perbarui README (masih mendeskripsikan "single-file, zero dependencies, `Kandidat AI`" dan tema warna lama "Dark Forest"). Perbarui juga dokumen arsitektur (menyebut Supabase tapi hanya 3 tabel).
9. **Skema database:** tambah tabel `jobs`, `cv_documents`, `interview_sessions`, `applications`, `scrape_requests`, `payments_events`. Ganti nama tabel `users` menjadi `profiles` yang terhubung `auth.users`.
10. **Observabilitas:** Sentry (error klien) dan log server untuk pengiriman email dan pembayaran.

---

## Rencana Kerja (Urutan Eksekusi)

### Sprint 1: Aman dulu (3-5 hari)
- [ ] Supabase Auth + hapus login/password lokal
- [ ] RLS ketat; kolom `tier/quota/role` terkunci
- [ ] Hapus admin via hash/PIN; admin berbasis role server
- [ ] Hapus tombol simulasi bayar; matikan fitur berbayar sampai gateway siap
- [ ] Matikan webhook email Apps Script; rotasi token Apify
- [ ] Escape semua `innerHTML` rawan

### Sprint 2: Fitur nyata (1-2 minggu)
- [ ] Endpoint `/api/cv-analyze` (LLM) + simpan CV ke database
- [ ] Endpoint skor wawancara berbasis pertanyaan + simpan sesi
- [ ] Pindah data loker ke `jobs.json`/tabel, hapus email tebakan, tambah kedaluwarsa
- [ ] Pengiriman email via Resend/SES dengan lampiran PDF, antrean di server, status nyata
- [ ] Payment gateway + webhook + `tier_expires_at`

### Sprint 3: UI (1 minggu)
- [ ] Ganti class Tailwind yang rusak; build Tailwind
- [ ] Satukan nama merek dan nama tier
- [ ] Dashboard pengguna, bottom nav mobile baru
- [ ] Ganti `alert/confirm/prompt` dengan toast/modal
- [ ] State kosong/loading/error; aksesibilitas dasar

### Sprint 4: Rapikan (3-5 hari)
- [ ] Pecah `index.html` ke modul (Vite)
- [ ] Bersihkan root repo, `.gitignore`, README baru
- [ ] Tes Playwright + CI

---

## Checklist Cepat Sebelum Dibuka ke Teman/Publik

- [ ] Tidak ada password di kode atau `localStorage`
- [ ] Tidak bisa jadi VIP tanpa pembayaran terverifikasi
- [ ] Tidak bisa membuka admin tanpa role di database
- [ ] Email hanya terkirim ke alamat terverifikasi, lewat domain pengirim sendiri
- [ ] Tidak ada klaim palsu (statistik, "AI", "terlampir PDF", "250 OK")
- [ ] Setiap tombol yang terlihat benar-benar melakukan apa yang tertulis
- [ ] Privasi: halaman Kebijakan Privasi dan Syarat Layanan, dan persetujuan penyimpanan CV (data pribadi, UU PDP)

---

## Lampiran: Daftar Temuan Berdasarkan Berkas

| Berkas | Baris | Temuan |
|---|---|---|
| `index.html` | 13154-13165 | Pengecekan admin lemah, PIN hardcoded |
| `index.html` | 14370 | `formatScore` konstan 95 |
| `index.html` | 14646-14666 | "Simpan ke Drive" = unduh HTML |
| `index.html` | 15106-15114 | Skor wawancara tidak melihat pertanyaan |
| `index.html` | 16102-16113 | Email HRD hasil tebakan |
| `index.html` | 17405-17416 | Lampiran CV hanya metadata |
| `index.html` | 17540-17620 | Blast: jeda 4,5 detik, log sukses palsu, kuota di klien |
| `index.html` | 18090-18091 | Client ID dan URL webhook publik |
| `index.html` | 18467-18479 | Login tanpa verifikasi password |
| `index.html` | 18628-18660 | Simulasi bayar = upgrade VIP |
| `index.html` | 18699-18710 | Akun default `password123`, transaksi palsu |
| `supabase-schema.sql` | 101-114 | RLS `USING (true)` |
| `supabase-schema.sql` | 77-93 | `decrement_blast_quota` ada, tidak dipakai klien |
| `google-apps-script-webhook.js` | 10-147 | Tanpa auth; kirim Gmail pemilik; variabel `emailSubject` di luar scope blok `catch` |
| `scrape-apify.js` | 10 | Token Apify sebagai fallback (belum ter-commit) |
| `vercel.json` | 1-23 | Belum ada CSP; `X-XSS-Protection` usang |
| root | - | `Prototipe Karir Copilot.html` duplikat; 15+ skrip patch |
