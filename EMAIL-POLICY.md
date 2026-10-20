# KEBIJAKAN PENGIRIMAN EMAIL & ANTI-SPAM (EMAIL POLICY)

**Layanan:** Lolos Kerja (`LOLOSKERJA.ID`)  
**Kepatuhan:** UU ITE (No. 11/2008 jo UU No. 1/2024), UU PDP No. 27/2022, CAN-SPAM Act, dan Google/Yahoo Sender Requirements 2024.

---

## 1. Prinsip Korespondensi Karir yang Sah (Legitimate Career Inquiries)
Lolos Kerja menerapkan prinsip etika dan kepatuhan hukum ketat dalam fitur Auto-Blast Email Lamaran Kerja:
1. **Hanya Kontak Resmi Rekrutmen:** Sistem hanya memfasilitasi pengiriman email ke alamat resmi yang dipublikasikan untuk keperluan penerimaan lowongan kerja (misal: `recruitment@perusahaan.com`, `careers@perusahaan.com`, atau alamat HR yang tercantum pada iklan lowongan resmi).
2. **Tanpa Tebakan Email Palsu:** Sistem tidak menggunakan generator tebakan email spekulatif.
3. **Persetujuan Pengguna (*Explicit User Consent*):** Setiap antrean email lamaran wajib ditinjau dan disetujui secara eksplisit oleh pelamar kerja sebelum dijadwalkan untuk dikirim.

## 2. Mekanisme Anti-Spam & Deliverability
Untuk menjaga reputasi domain pengirim dan kepatuhan regulasi:
1. **Algoritma Smart Drip & Jeda Acak:** Pengiriman dilakukan bertahap dengan jeda acak 45–90 detik antar pesan selama jam kerja wajar (08:00 – 17:00 WIB), bukan semburan massal sekaligus (*bulk blast*).
2. **Batas Harian Ketat (*Daily Rate Limits*):**
   - Paket Free: 0 email.
   - Paket 24 Jam: Maksimal 10 email total.
   - Paket Dibantuin: Maksimal 10 email per hari.
   - Paket VIP: Maksimal 30–40 email per hari.
3. **Frekuensi per Perusahaan:** Satu perusahaan target maksimal hanya dapat dikirimi 1 email per 30 hari kalender oleh satu pengguna untuk mencegah banjir email rekruter.
4. **Otentikasi Domain Penuh:** Seluruh pengiriman melalui domain resmi dilengkapi protokol SPF (*Sender Policy Framework*), DKIM (*DomainKeys Identified Mail*), dan DMARC (*Domain-based Message Authentication, Reporting, and Conformance*).

## 3. Hak Berhenti Berlangganan (One-Click Unsubscribe)
Setiap email yang dikirimkan melalui platform memuat tautan berhenti berlangganan (*Unsubscribe Link*) dan header RFC-8058 `List-Unsubscribe`.
- Jika rekruter atau pihak perusahaan menekan tautan berhenti, alamat email perusahaan tersebut otomatis dimasukkan ke dalam **Daftar Blokir Global (*Global Email Blocklist*)** kami dan tidak akan pernah menerima lamaran lagi dari seluruh pengguna platform.

## 4. Penanganan Mental (Bounce Handling) & Spam Complaint
- Setiap alamat email yang mengalami kegagalan permanen (*hard bounce*) langsung diblokir secara otomatis.
- Jika tingkat bounce rate sistem dalam 24 jam melampaui 3% atau spam complaint mencapai 0.1%, pengiriman otomatis dijeda secara global untuk investigasi kualitas data.
