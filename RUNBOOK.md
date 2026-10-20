# PETUNJUK OPERASIONAL SISTEM (RUNBOOK) - LOLOS KERJA

**Sasaran:** Tim Operasional Dimitri HQ (Administrator, DevOps, dan Customer Support)  
**Tujuan:** Standar Operasional Prosedur (SOP) penanganan insiden, pemeliharaan berkala, rotasi kunci, dan eskalasi.
**Versi:** 2.2.0

---

## 1. Penanganan Darurat Pengiriman Email (Blast Emergency)

### Kondisi: Bounce Rate Melonjak (> 3%) atau Muncul Keluhan Spam
1. **Jeda Pengiriman Global (Emergency Pause):**
   - Di dashboard Vercel: Set variable `DRY_RUN=true` atau `BLAST_PAUSED=true`.
   - Atau di GitHub Actions: Matikan workflow `blast-tick` (`Actions -> blast-tick -> Disable workflow`).
2. **Audit Antrean & Log:**
   - Jalankan query di Supabase SQL Console:
     ```sql
     SELECT target_company, recruiter_email, status, error, created_at 
     FROM public.applications 
     WHERE updated_at > NOW() - INTERVAL '24 hours' AND status = 'failed';
     ```
3. **Tambahkan ke Daftar Blokir:**
   - Masukkan domain atau email penerima ke tabel `public.email_blocklist`:
     ```sql
     INSERT INTO public.email_blocklist (email_or_domain, reason)
     VALUES ('hr@problematic-domain.com', 'High bounce / spam complaint');
     ```
4. **Verifikasi Reputasi Domain:**
   - Periksa Google Postmaster Tools dan dashboard Resend untuk status DMARC, DKIM, dan spam complaint rate (< 0.1%).

---

## 2. Pengelolaan Pembayaran Manual

### Prosedur Konfirmasi Pembayaran QRIS / Transfer:
1. Buka Command Center Admin (`/admin` atau tab Monitoring).
2. Pilih sub-tab **Audit Pembayaran**.
3. Temukan transaksi berstatus `PENDING` yang telah diverifikasi bukti mutasinya di rekening bank / mutasi QRIS.
4. Klik tombol **Konfirmasi Pembayaran (Setujui)**.
5. Sistem serverless `/api/billing/admin-confirm.js` otomatis:
   - Mengubah status ke `SETTLED`.
   - Menambahkan kuota blast akun (+10 untuk FLASH, +10 harian untuk DIBANTUIN, +40 harian untuk VIP).
   - Menetapkan tanggal kedaluwarsa `tier_expires_at` (24 jam untuk FLASH, 30 hari kalender untuk DIBANTUIN/VIP).
   - Idempoten: pemanggilan ulang pada pesanan yang sudah `SETTLED` akan ditolak tanpa menduplikasi kredit.

---

## 3. Penambahan Akun Administrator / Owner Baru

Jalankan perintah SQL berikut di Supabase Dashboard (memakai `0003_seed_promote_owner.sql`):
```sql
UPDATE public.profiles 
SET role = 'owner', tier = 'VIP'
WHERE email = 'target_email@dimitrihq.com';
```
*(Catatan: Akun target harus sudah terdaftar terlebih dahulu di `auth.users` via Supabase Auth).*

---

## 4. Rollback Deployment (Vercel)

Jika terjadi insiden fatal pada rilis produksi terbaru:
1. Buka **Vercel Dashboard** -> Proyek `Lolos-Kerja` -> Tab **Deployments**.
2. Cari deployment stabil sebelumnya (misal commit `5e1347a` atau `ff961a1`).
3. Klik tombol menu (tiga titik `...`) pada deployment tersebut -> Pilih **Instant Rollback**.
4. Verifikasi bahwa traffic produksi dialihkan kembali ke snapshot yang stabil dalam hitungan detik.
5. Buat hotfix branch di git lokal untuk menambal bug sebelum rilis ulang.

---

## 5. Rotasi Kunci Rahasia (Secret Key Rotation)

1. **Supabase Service Role Key:**
   - Jika service role key bocor, rotasi segera di Supabase Dashboard (`Project Settings -> API -> Generate new service role key`).
   - Perbarui secret `SUPABASE_SERVICE_ROLE_KEY` di Vercel Environment Variables.
2. **Resend API Key:**
   - Buat key baru di dashboard Resend -> Update `RESEND_API_KEY` di Vercel -> Hapus key lama setelah pengujian terverifikasi sukses.
3. **Anthropic Claude API Key:**
   - Buat key baru di Anthropic Console -> Update `ANTHROPIC_API_KEY` di Vercel -> Revoke key lama.
4. **Apify Scraper Token:**
   - Buat token baru di Apify Console -> Simpan di GitHub Secrets `APIFY_TOKEN`.
