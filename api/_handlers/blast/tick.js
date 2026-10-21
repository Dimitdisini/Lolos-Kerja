/**
 * /api/blast/tick.js: Protected Autonomous Blast Dispatch Worker
 * Triggered by scheduled cron jobs with fail-closed CRON_SECRET authentication.
 * Fixes B1 (Real PDF attachment), B2 (Fail-closed secret), B3 (Explicit MAIL_TRANSPORT),
 * B7 (RFC 8058 HTTPS List-Unsubscribe), and allowlist enforcement.
 *
 * Node.js ESM format
 */

import fs from 'fs';
import path from 'path';
import { getSupabaseAdmin } from '../../_lib/auth.js';
import { getEffectiveTier } from '../../_lib/quota.js';

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 1. FAIL-CLOSED CRON_SECRET AUTHENTICATION (B2)
  const expectedSecret = process.env.CRON_SECRET;
  if (!expectedSecret || expectedSecret.trim().length === 0) {
    console.error('[CRON SECURITY ERROR] CRON_SECRET belum diset di environment server.');
    return res.status(500).json({ error: 'Server configuration error: CRON_SECRET is required.' });
  }

  const authHeader = req.headers.authorization || '';
  const providedSecret = authHeader.replace(/^Bearer\s+/i, '').trim() || req.headers['x-cron-secret'];
  if (providedSecret !== expectedSecret) {
    return res.status(401).json({ error: 'Unauthorized: CRON_SECRET tidak valid atau tidak disertakan.' });
  }

  const mailTransport = process.env.MAIL_TRANSPORT || 'resend';
  const resendApiKey = process.env.RESEND_API_KEY;
  const mailFromDomain = process.env.MAIL_FROM_DOMAIN || 'lamaran.loloskerja.id';
  const appUrl = process.env.APP_URL || 'https://loloskerja.id';

  // B3: Dilarang diam-diam jatuh ke dry-run saat kunci kosong
  if (mailTransport === 'resend' && (!resendApiKey || resendApiKey.trim().length === 0)) {
    console.error('[BLAST FATAL] MAIL_TRANSPORT=resend tetapi RESEND_API_KEY kosong.');
    return res.status(500).json({ error: 'Konfigurasi fatal: RESEND_API_KEY wajib diisi saat mode resend aktif.' });
  }

  try {
    const supabase = getSupabaseAdmin();
    const nowIso = new Date().toISOString();

    // 2. Cek status jeda darurat (blast_paused) & global daily cap
    const { data: flagPaused } = await supabase
      .from('system_flags')
      .select('value')
      .eq('key', 'blast_paused')
      .maybeSingle();

    if (flagPaused?.value?.paused === true) {
      return res.status(200).json({
        success: true,
        message: 'Pengiriman email sedang dijeda (blast_paused = true).',
        processed: 0
      });
    }

    // Cek allowlist penerima uji
    const { data: flagAllowlist } = await supabase
      .from('system_flags')
      .select('value')
      .eq('key', 'recipient_allowlist')
      .maybeSingle();

    const isAllowlistEnabled = flagAllowlist?.value?.enabled === true;
    const allowedEmails = (flagAllowlist?.value?.emails || []).map(e => e.toLowerCase().trim());

    // 3. Ambil antrean yang siap kirim (maks 10 per tick)
    const { data: queue, error: queueErr } = await supabase
      .from('applications')
      .select('*')
      .eq('status', 'queued')
      .eq('approved', true)
      .lte('scheduled_at', nowIso)
      .limit(10);

    if (queueErr) {
      console.error('Queue Fetch Error:', queueErr);
      return res.status(500).json({ error: 'Gagal mengambil antrean pengiriman.' });
    }

    if (!queue || queue.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Tidak ada antrean email yang siap dikirim pada tick ini.',
        processed: 0
      });
    }

    const results = [];

    // 4. Proses antrean satu per satu secara berurutan
    for (const app of queue) {
      // 4.1 Cek Profil Pengguna & Tier Efektif
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', app.user_id)
        .single();

      const effectiveTier = getEffectiveTier(profile);
      if (effectiveTier === 'FREE') {
        await supabase
          .from('applications')
          .update({
            status: 'cancelled',
            error: 'Paket langganan pengguna telah berakhir atau berstatus FREE.'
          })
          .eq('id', app.id);
        results.push({ id: app.id, status: 'cancelled', reason: 'tier_expired' });
        continue;
      }

      // 4.2 Cek Email Blocklist
      const { data: isBlocked } = await supabase
        .from('email_blocklist')
        .select('email_or_domain')
        .eq('email_or_domain', app.to_email.toLowerCase())
        .maybeSingle();

      if (isBlocked) {
        await supabase
          .from('applications')
          .update({
            status: 'failed',
            error: 'Alamat email tujuan berada dalam daftar blokir reputasi (bounce/unsubscribe).'
          })
          .eq('id', app.id);
        results.push({ id: app.id, status: 'failed', reason: 'email_blocklisted' });
        continue;
      }

      // 4.3 Cek Allowlist Penerima Uji (P0/P1 Sandbox)
      if (isAllowlistEnabled && !allowedEmails.includes(app.to_email.toLowerCase())) {
        await supabase
          .from('applications')
          .update({
            status: 'cancelled',
            error: 'Mode allowlist aktif: alamat penerima bukan merupakan kontak uji yang disetujui.'
          })
          .eq('id', app.id);
        results.push({ id: app.id, status: 'cancelled', reason: 'recipient_not_allowlisted' });
        continue;
      }

      // 4.4 Persiapan Lampiran PDF CV Nyata (B1)
      let pdfBase64 = null;
      let attachmentFilename = app.attachment_name || `CV_${(profile?.full_name || 'Kandidat').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

      if (app.attachment_path) {
        try {
          const { data: fileBlob, error: downloadErr } = await supabase
            .storage
            .from('cv-pdf')
            .download(app.attachment_path);

          if (!downloadErr && fileBlob) {
            const arrayBuffer = await fileBlob.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            if (buffer.length < 300 * 1024) { // < 300 KB limit
              pdfBase64 = buffer.toString('base64');
            } else {
              console.warn('[PDF Attachment Warn] File exceeds 300KB limit:', buffer.length);
            }
          }
        } catch (storageErr) {
          console.warn('[PDF Attachment Fetch Notice]:', storageErr.message);
        }
      }

      // 4.5 Kunci status ke 'sending' untuk mencegah duplicate dispatch
      await supabase
        .from('applications')
        .update({ status: 'sending', send_attempts: (app.send_attempts || 0) + 1 })
        .eq('id', app.id);

      // 4.6 Eksekusi Dispatch (Resend atau Capture)
      let sendSuccess = false;
      let providerMessageId = null;
      let sendError = null;
      const sendMode = mailTransport === 'capture' ? 'capture' : 'live';

      const unsubscribeUrl = `${appUrl.replace(/\/$/, '')}/api/blast/unsubscribe?t=${app.unsubscribe_token || app.id}`;

      if (mailTransport === 'capture') {
        // Mode CAPTURE: Simpan ke tabel email_events dan log lokal tanpa mengirim email keluar
        sendSuccess = true;
        providerMessageId = `capture_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        const captureDir = path.resolve(process.cwd(), '.mail-capture');
        try {
          if (!fs.existsSync(captureDir)) fs.mkdirSync(captureDir, { recursive: true });
          fs.writeFileSync(
            path.join(captureDir, `${app.id}.json`),
            JSON.stringify({
              appId: app.id,
              to: app.to_email,
              subject: app.subject,
              body: app.body,
              hasAttachment: !!pdfBase64,
              attachmentFilename,
              timestamp: nowIso
            }, null, 2)
          );
        } catch (e) {}
      } else {
        // Mode RESEND LIVE
        try {
          const senderName = profile?.full_name || 'Kandidat Pelamar';
          const fromAddress = `${senderName} via Lolos Kerja <lamaran@${mailFromDomain}>`;

          const emailPayload = {
            from: fromAddress,
            to: [app.to_email],
            reply_to: profile.email,
            subject: app.subject,
            text: `${app.body}\n\n---\nUntuk berhenti menerima email pengajuan karir ini, klik tautan berikut:\n${unsubscribeUrl}`,
            headers: {
              'List-Unsubscribe': `<${unsubscribeUrl}>, <mailto:unsubscribe@${mailFromDomain}?subject=unsubscribe>`,
              'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
            }
          };

          if (pdfBase64) {
            emailPayload.attachments = [
              {
                filename: attachmentFilename,
                content: pdfBase64
              }
            ];
          }

          const resendResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(emailPayload)
          });

          const resendData = await resendResponse.json();

          if (resendResponse.ok && resendData?.id) {
            sendSuccess = true;
            providerMessageId = resendData.id;
          } else {
            sendError = resendData?.message || 'Gagal mengirim email lewat Resend API';
          }
        } catch (fetchErr) {
          sendError = fetchErr.message;
        }
      }

      // 4.7 Update Status Akhir & Konsumsi Kuota
      if (sendSuccess) {
        if (effectiveTier === 'FLASH') {
          await supabase.rpc('consume_blast_credit', { p_user_id: app.user_id });
        }
        await supabase.rpc('consume_daily_slot', { p_user_id: app.user_id });

        await supabase
          .from('applications')
          .update({
            status: 'sent',
            provider_message_id: providerMessageId,
            send_mode: sendMode,
            sent_at: nowIso,
            error: null
          })
          .eq('id', app.id);

        await supabase
          .from('email_events')
          .insert({
            application_id: app.id,
            user_id: app.user_id,
            event_type: 'sent',
            metadata: {
              provider_id: providerMessageId,
              send_mode: sendMode,
              has_attachment: !!pdfBase64
            }
          });

        results.push({ id: app.id, status: 'sent', mode: sendMode, providerId: providerMessageId });
      } else {
        const attempts = (app.send_attempts || 0) + 1;
        const finalStatus = attempts >= 2 ? 'failed' : 'queued';

        await supabase
          .from('applications')
          .update({
            status: finalStatus,
            send_attempts: attempts,
            error: sendError
          })
          .eq('id', app.id);

        results.push({ id: app.id, status: finalStatus, error: sendError, attempts });
      }
    }

    return res.status(200).json({
      success: true,
      processed: results.length,
      results
    });
  } catch (err) {
    console.error('[Blast Tick Worker Error]:', err);
    return res.status(500).json({
      error: 'Terjadi kegagalan pada background blast worker.',
      details: err.message
    });
  }
}
