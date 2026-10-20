# PETUNJUK OPERASIONAL SISTEM (RUNBOOK) - LOLOS KERJA

**Sasaran:** Tim Operasional Dimitri HQ (Administrator, DevOps, dan Customer Support)  
**Tujuan:** Standar Operasional Prosedur (SOP) penanganan insiden, pemeliharaan berkala, dan eskalasi.

---

## 1. Penanganan Darurat Pengiriman Email (Blast Emergency)

### Kondisi: Bounce Rate Melonjak (> 3%) atau Muncul Keluhan Spam
1. **Jeda Pengiriman Global:**
   - Ubah environment variable di Vercel: `DRY_RUN=true` atau nonaktifkan cron di GitHub Actions (`Actions -> blast-tick -> Disable workflow`).
2. **Audit Antrean:**
   - Jalankan query di Supabase SQL Console:
     ```sql
     SELECT target_company, recruiter_email, status, error 
     FROM public.blast_logs 
     WHERE sent_at > NOW() - INTERVAL '24 hours' AND status != 'TERKIRIM';
     ```
3. **Tambahkan ke Daftar Blokir:**
   - Masukkan domain/email bermasalah ke `email_blocklist`.
4. **Verifikasi Reputasi Domain:**
   - Periksa Google Postmaster Tools dan dashboard Resend untuk status DMARC/DKIM.

---

## 2. Pengelolaan Pembayaran Manual

### Prosedur Konfirmasi Pembayaran QRIS / Transfer:
1. Buka Command Center Admin (`/admin` atau tab Monitoring).
2. Pilih sub-tab **Audit Pembayaran**.
3. Temukan transaksi berstatus `PENDING` yang telah diverifikasi bukti mutasinya.
4. Klik tombol **Konfirmasi Pembayaran (Setujui)**.
5. Sistem otomatis:
   - Mengubah status ke `SETTLED`.
   - Menambahkan kuota blast akun (+10 untuk FLASH, +20 untuk DIBANTUIN, +50 untuk VIP).
   - Menetapkan tanggal kedaluwarsa `tier_expires_at` (24 jam untuk FLASH, 30 hari untuk DIBANTUIN/VIP).

---

## 3. Penambahan Akun Administrator / Owner Baru

Jalankan perintah SQL berikut di Supabase Dashboard:
```sql
UPDATE public.users 
SET role = 'admin', tier = 'VIP', blast_quota = 100 
WHERE email = 'target_email@domain.com';
```
*(Catatan: Pengguna harus sudah mendaftar akun terlebih dahulu via antarmuka).*

---

## 4. Rotasi Kunci Rahasia (Secret Key Rotation)

1. **Supabase Key:**
   - Jika service role key bocor, rotasi segera di Supabase Dashboard (`Project Settings -> API`).
   - Perbarui secret `SUPABASE_SERVICE_ROLE_KEY` di Vercel Environment Variables.
2. **Resend API Key:**
   - Buat key baru di Resend Dashboard -> Update `RESEND_API_KEY` di Vercel -> Hapus key lama setelah pengujian sukses.
3. **Apify Token:**
   - Buat token baru di Apify Console -> Simpan di GitHub Secrets `APIFY_TOKEN`.
