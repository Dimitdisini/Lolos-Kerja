/**
 * /api/blast/tick.js: Protected Autonomous Blast Dispatch Worker
 * Triggered by scheduled cron jobs with strict CRON_SECRET authentication.
 * Node.js ESM Vercel Serverless Function
 */

import { getSupabaseAdmin } from '../_lib/auth.js';
import { getEffectiveTier } from '../_lib/quota.js';

export default async function handler(req, res) {
  // Hanya menerima POST atau GET dari scheduler cron
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 1. Verifikasi CRON_SECRET
  const expectedSecret = process.env.CRON_SECRET;
  if (expectedSecret) {
    const authHeader = req.headers.authorization || '';
    const providedSecret = authHeader.replace(/^Bearer\s+/i, '').trim() || req.headers['x-cron-secret'];
    if (providedSecret !== expectedSecret) {
      return res.status(401).json({ error: 'Unauthorized: CRON_SECRET tidak valid atau tidak disertakan.' });
    }
  }

  const dryRun = process.env.DRY_RUN === 'true' || !process.env.RESEND_API_KEY;
  const resendApiKey = process.env.RESEND_API_KEY;
  const mailFromDomain = process.env.MAIL_FROM_DOMAIN || 'loloskerja.id';

  try {
    const supabase = getSupabaseAdmin();
    const nowIso = new Date().toISOString();

    // 2. Ambil antrean yang siap kirim (maks 10 per tick untuk mencegah timeout)
    const { data: queue, error: queueErr } = await supabase
      .from('applications')
      .select('id, user_id, company, position, to_email, subject, body, cv_variant_id')
      .eq('approved', true)
      .eq('status', 'queued')
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

    // 3. Proses pengiriman satu per satu secara berurutan
    for (const app of queue) {
      // 3.1 Cek Profil Pengguna & Tier Efektif
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

      // 3.2 Cek Email Blocklist
      const { data: isBlocked } = await supabase
        .from('email_blocklist')
        .select('email')
        .eq('email', app.to_email.toLowerCase())
        .single();

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

      // 3.3 Kunci status ke 'sending' untuk mencegah duplicate dispatch
      await supabase
        .from('applications')
        .update({ status: 'sending' })
        .eq('id', app.id);

      // 3.4 Eksekusi Kirim (Resend API atau DRY_RUN)
      let sendSuccess = false;
      let providerMessageId = null;
      let sendError = null;

      if (dryRun) {
        // DRY RUN: Catat simulasi sukses tanpa memanggil penyedia email pihak ketiga
        sendSuccess = true;
        providerMessageId = `dryrun_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      } else {
        try {
          const senderName = profile?.full_name || 'Kandidat Pelamar';
          const fromAddress = `${senderName} via Lolos Kerja <lamaran@${mailFromDomain}>`;

          const resendPayload = {
            from: fromAddress,
            to: [app.to_email],
            reply_to: profile.email,
            subject: app.subject,
            text: app.body,
            headers: {
              'List-Unsubscribe': `<mailto:unsubscribe@${mailFromDomain}?subject=unsubscribe_${app.to_email}>`
            }
          };

          const resendResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(resendPayload)
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

      // 3.5 Pembaruan Status & Log Audit Email Event
      if (sendSuccess) {
        // Potong slot harian & kredit
        if (effectiveTier === 'FLASH') {
          await supabase.rpc('consume_blast_credit', { p_user_id: app.user_id });
        }

        await supabase
          .from('applications')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            provider_message_id: providerMessageId,
            error: null
          })
          .eq('id', app.id);

        await supabase
          .from('email_events')
          .insert({
            application_id: app.id,
            type: dryRun ? 'dry_run_sent' : 'sent',
            payload: { provider_message_id: providerMessageId, dryRun }
          });

        results.push({ id: app.id, status: 'sent', providerMessageId });
      } else {
        await supabase
          .from('applications')
          .update({
            status: 'failed',
            error: sendError
          })
          .eq('id', app.id);

        await supabase
          .from('email_events')
          .insert({
            application_id: app.id,
            type: 'failed',
            payload: { error: sendError }
          });

        results.push({ id: app.id, status: 'failed', error: sendError });
      }
    }

    return res.status(200).json({
      success: true,
      mode: dryRun ? 'DRY_RUN' : 'PRODUCTION',
      processed: results.length,
      results
    });
  } catch (err) {
    console.error('Blast Tick Fatal Error:', err);
    return res.status(500).json({
      error: 'Terjadi kegagalan kritis pada Blast Tick Engine.',
      details: err.message
    });
  }
}
