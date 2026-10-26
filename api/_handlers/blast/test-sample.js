/**
 * /api/blast/test-sample.js: Instant Test Sample Dispatcher
 * Dispatches 1 sample email with standardized corporate cover letter & Harvard ATS PDF attachment
 * Supports:
 * 1. Personal SMTP (Gmail App Password, Yahoo, Custom SMTP)
 * 2. Official Resend API Transport
 * Node.js ESM Vercel Serverless Function
 */

import nodemailer from 'nodemailer';
import { applyRateLimit } from '../../_lib/rateLimit.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Rate limit: max 10 test emails per 10 minutes per IP
  if (!applyRateLimit(req, res, { maxRequests: 10, windowMs: 600000 })) {
    return;
  }

  const {
    testEmail,
    senderName = 'Kandidat Pelamar',
    senderEmail,
    subject,
    coverLetter,
    smtpConfig,
    pdfBase64
  } = req.body || {};

  if (!testEmail || !testEmail.includes('@')) {
    return res.status(400).json({ error: 'Alamat email penerima uji coba tidak valid.' });
  }

  const emailSubject = subject || `Lamaran Pekerjaan: Fresh Graduate ATS - ${senderName}`;
  const emailBodyText = coverLetter || `Yth. Tim Rekrutmen,\n\nSaya ${senderName}, mengajukan diri untuk lowongan pekerjaan yang tersedia.\n\nTerlampir Curriculum Vitae (CV) ATS Harvard lengkap saya.\n\nHormat saya,\n${senderName}`;

  const emailBodyHtml = `
    <div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #1e293b; max-width: 650px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; background: #ffffff;">
      <div style="border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 18px;">
        <span style="font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #2563eb; background: #eff6ff; padding: 4px 8px; border-radius: 6px;">[Sampel Lamaran Uji Coba Lolos Kerja]</span>
      </div>
      <div style="white-space: pre-wrap; font-size: 14px; color: #334155;">${emailBodyText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 16px 0;" />
      <p style="font-size: 11px; color: #94a3b8; margin: 0;">
        Pesan ini dikirimkan melalui fitur Uji Coba Pengiriman Lolos Kerja (Career Copilot) untuk memverifikasi tata letak surat dan kelengkapan lampiran berkas CV.
      </p>
    </div>
  `;

  // Attach real PDF if provided
  const attachments = [];
  if (pdfBase64 && typeof pdfBase64 === 'string') {
    const cleanBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/, '');
    attachments.push({
      filename: `CV_Harvard_ATS_${senderName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
      content: Buffer.from(cleanBase64, 'base64'),
      contentType: 'application/pdf'
    });
  }

  // JALUR 1: PENGIRIMAN DENGAN SMTP PRIBADI (Gmail App Password / Custom SMTP)
  if (smtpConfig && smtpConfig.user && smtpConfig.pass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpConfig.host || 'smtp.gmail.com',
        port: parseInt(smtpConfig.port, 10) || 465,
        secure: (parseInt(smtpConfig.port, 10) || 465) === 465,
        auth: {
          user: smtpConfig.user.trim(),
          pass: smtpConfig.pass.trim()
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      const info = await transporter.sendMail({
        from: `"${senderName}" <${smtpConfig.user.trim()}>`,
        to: testEmail.trim(),
        subject: emailSubject,
        text: emailBodyText,
        html: emailBodyHtml,
        attachments
      });

      return res.status(200).json({
        success: true,
        channel: 'smtp_personal',
        message: `Email sampel berhasil dikirim ke ${testEmail} menggunakan akun pribadi (${smtpConfig.user}).`,
        messageId: info.messageId
      });
    } catch (err) {
      console.error('[SMTP Personal Send Error]:', err);
      return res.status(500).json({
        error: `Gagal mengirim via akun email pribadi: ${err.message}. Pastikan App Password 16-digit Gmail sudah benar.`,
        details: err.message
      });
    }
  }

  // JALUR 2: PENGIRIMAN DENGAN PLATFORM RESEND
  const resendApiKey = process.env.RESEND_API_KEY;
  const mailFromDomain = process.env.MAIL_FROM_DOMAIN || 'lamaran.loloskerja.id';

  if (!resendApiKey) {
    // Mode Simulasi / Local Dev
    console.log(`[TEST SAMPLE SIMULATION] Sent to ${testEmail} | Subject: ${emailSubject}`);
    return res.status(200).json({
      success: true,
      channel: 'simulation',
      message: `[Simulasi Sukses] Email sampel terverifikasi siap dikirim ke ${testEmail}. (RESEND_API_KEY belum disetel).`
    });
  }

  try {
    const resendPayload = {
      from: `"${senderName}" <applicant@${mailFromDomain}>`,
      to: [testEmail.trim()],
      subject: emailSubject,
      text: emailBodyText,
      html: emailBodyHtml,
      reply_to: senderEmail || undefined
    };

    if (attachments.length > 0) {
      resendPayload.attachments = [{
        filename: attachments[0].filename,
        content: attachments[0].content.toString('base64')
      }];
    }

    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(resendPayload)
    });

    const resendResult = await resp.json();
    if (!resp.ok) {
      return res.status(resp.status).json({
        error: resendResult.message || 'Gagal mengirim email via Resend.',
        details: resendResult
      });
    }

    return res.status(200).json({
      success: true,
      channel: 'resend_platform',
      message: `Email sampel berhasil dikirim ke ${testEmail} melalui server resmi Lolos Kerja.`,
      messageId: resendResult.id
    });
  } catch (err) {
    console.error('[Test Sample Handler Fatal Error]:', err);
    return res.status(500).json({
      error: 'Terjadi kendala sistem saat mengirim email uji coba.',
      details: err.message
    });
  }
}
