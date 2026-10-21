/**
 * /api/blast/webhook-resend.js: Resend Webhook Event Collector & Auto-Circuit Breaker
 * Tracks delivered, bounced, and complained email events.
 * Automatically adds addresses to email_blocklist and trips circuit breaker (blast_paused) if bounce rate > 5%.
 *
 * Node.js ESM format
 */

import { getSupabaseAdmin } from '../../_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const event = req.body;
  if (!event || !event.type) {
    return res.status(400).json({ error: 'Payload webhook tidak valid.' });
  }

  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.warn('[Resend Webhook Notice] Supabase credentials not set, event acknowledged in dry-run mode.');
      return res.status(200).json({ ok: true, dryRun: true });
    }

    const supabase = getSupabaseAdmin();
    const eventType = event.type; // 'email.delivered', 'email.bounced', 'email.complained'
    const eventData = event.data || {};
    const recipientEmail = Array.isArray(eventData.to) ? eventData.to[0] : eventData.to;
    const providerMessageId = eventData.email_id || eventData.id;

    // 1. Catat ke tabel email_events
    await supabase
      .from('email_events')
      .insert({
        event_type: eventType.replace('email.', ''),
        metadata: event
      });

    // 2. Jika Bounce atau Complaint:
    if (eventType === 'email.bounced' || eventType === 'email.complained') {
      const reason = eventType === 'email.complained' ? 'Spam complaint reported' : (eventData.bounce?.message || 'Delivery bounce');

      // (a) Masukkan ke email_blocklist
      if (recipientEmail) {
        await supabase
          .from('email_blocklist')
          .upsert({
            email_or_domain: recipientEmail.toLowerCase().trim(),
            reason
          }, { onConflict: 'email_or_domain' });
      }

      // (b) Update status aplikasi terkait jika provider_message_id cocok
      if (providerMessageId) {
        await supabase
          .from('applications')
          .update({
            status: 'failed',
            error: `Penyedia email melaporkan: ${reason}`
          })
          .eq('provider_message_id', providerMessageId);
      }

      // 3. CIRCUIT BREAKER: Hitung bounce rate dalam 24 jam terakhir
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count: totalSent } = await supabase
        .from('email_events')
        .select('id', { count: 'exact', head: true })
        .eq('event_type', 'sent')
        .gte('created_at', twentyFourHoursAgo);

      const { count: totalBounced } = await supabase
        .from('email_events')
        .select('id', { count: 'exact', head: true })
        .in('event_type', ['bounced', 'complained'])
        .gte('created_at', twentyFourHoursAgo);

      if (totalSent && totalSent >= 10) {
        const bounceRate = ((totalBounced || 0) / totalSent) * 100;
        if (bounceRate > 5 || eventType === 'email.complained') {
          console.warn(`[CIRCUIT BREAKER TRIPPED] Bounce rate ${bounceRate.toFixed(1)}% melebihi batas 5%. Menjeda seluruh pengiriman.`);
          await supabase
            .from('system_flags')
            .upsert({
              key: 'blast_paused',
              value: { paused: true, reason: `Auto-pause triggered: 24h bounce rate is ${bounceRate.toFixed(1)}%` },
              updated_at: new Date().toISOString()
            });
        }
      }
    }

    return res.status(200).json({ success: true, receivedEvent: eventType });
  } catch (err) {
    console.error('[Resend Webhook Error]:', err);
    return res.status(500).json({ error: 'Gagal memproses event webhook.', details: err.message });
  }
}
