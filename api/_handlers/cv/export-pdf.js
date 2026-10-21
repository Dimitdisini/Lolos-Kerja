/**
 * /api/cv/export-pdf.js: Real Harvard ATS 1-Column PDF Generator
 * Powered by pdf-lib on Vercel Serverless
 * Node.js ESM format
 */

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { verifyAuth, getSupabaseAdmin } from '../../_lib/auth.js';
import { isFeatureAllowed } from '../../_lib/limits.js';
import { applyRateLimit } from '../../_lib/rateLimit.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!applyRateLimit(req, res, { maxRequests: 20, windowMs: 60000 })) {
    return;
  }

  const authSession = await verifyAuth(req);
  const userTier = authSession ? authSession.effectiveTier : 'FREE';
  const shouldWatermark = !isFeatureAllowed(userTier, 'clean_pdf_export');

  let { masterProfile, cvId, variantId, returnJson = false } = req.body || {};

  if (!masterProfile && cvId && authSession) {
    try {
      const supabase = getSupabaseAdmin();
      const { data: cvDoc } = await supabase
        .from('cv_documents')
        .select('master_profile')
        .eq('id', cvId)
        .eq('user_id', authSession.user.id)
        .maybeSingle();

      if (cvDoc?.master_profile) {
        masterProfile = cvDoc.master_profile;
      }
    } catch (fetchErr) {
      console.warn('Gagal mengambil cv_documents:', fetchErr.message);
    }
  }

  if (!masterProfile || typeof masterProfile !== 'object') {
    return res.status(400).json({
      error: 'Data masterProfile atau cvId yang valid diperlukan untuk menghasilkan PDF Harvard ATS.'
    });
  }

  try {
    const pdfDoc = await PDFDocument.create();
    // A4 dimensions: 595.28 x 841.89 points
    let page = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();

    const fontBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const fontItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);

    const marginX = 50;
    let currentY = height - 50;
    const contentWidth = width - (marginX * 2);

    function checkPageOverflow(requiredSpace = 30) {
      if (currentY - requiredSpace < 50) {
        page = pdfDoc.addPage([595.28, 841.89]);
        currentY = height - 50;
      }
    }

    // 1. Header: Name & Contact
    const name = masterProfile.identity?.name || 'KANDIDAT PELAMAR';
    page.drawText(name.toUpperCase(), {
      x: marginX,
      y: currentY,
      size: 16,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1)
    });
    currentY -= 20;

    const contactParts = [];
    if (masterProfile.identity?.email) contactParts.push(masterProfile.identity.email);
    if (masterProfile.identity?.phone) contactParts.push(masterProfile.identity.phone);
    if (masterProfile.identity?.city) contactParts.push(masterProfile.identity.city);
    if (Array.isArray(masterProfile.identity?.links)) {
      masterProfile.identity.links.forEach(l => contactParts.push(l));
    }

    const contactLine = contactParts.join(' | ');
    if (contactLine) {
      page.drawText(contactLine, {
        x: marginX,
        y: currentY,
        size: 9.5,
        font: fontRegular,
        color: rgb(0.25, 0.25, 0.25)
      });
      currentY -= 16;
    }

    // Divider line
    page.drawLine({
      start: { x: marginX, y: currentY },
      end: { x: width - marginX, y: currentY },
      thickness: 0.8,
      color: rgb(0.2, 0.2, 0.2)
    });
    currentY -= 18;

    // Helper: Draw Section Title
    function drawSectionTitle(title) {
      checkPageOverflow(40);
      page.drawText(title.toUpperCase(), {
        x: marginX,
        y: currentY,
        size: 11,
        font: fontBold,
        color: rgb(0.1, 0.1, 0.1)
      });
      currentY -= 6;
      page.drawLine({
        start: { x: marginX, y: currentY },
        end: { x: width - marginX, y: currentY },
        thickness: 0.5,
        color: rgb(0.5, 0.5, 0.5)
      });
      currentY -= 14;
    }

    // 2. Summary
    if (masterProfile.summary) {
      drawSectionTitle('Ringkasan Profesional');
      const words = masterProfile.summary.split(/\s+/);
      let line = '';
      for (const w of words) {
        const testLine = line ? `${line} ${w}` : w;
        const textWidth = fontRegular.widthOfTextAtSize(testLine, 10);
        if (textWidth > contentWidth) {
          checkPageOverflow(16);
          page.drawText(line, { x: marginX, y: currentY, size: 10, font: fontRegular });
          currentY -= 14;
          line = w;
        } else {
          line = testLine;
        }
      }
      if (line) {
        checkPageOverflow(16);
        page.drawText(line, { x: marginX, y: currentY, size: 10, font: fontRegular });
        currentY -= 18;
      }
    }

    // 3. Education
    if (Array.isArray(masterProfile.education) && masterProfile.education.length > 0) {
      drawSectionTitle('Pendidikan');
      for (const edu of masterProfile.education) {
        checkPageOverflow(30);
        const schoolText = edu.school || 'Universitas / Institut';
        const dateText = [edu.start, edu.end].filter(Boolean).join(' - ');

        page.drawText(schoolText, { x: marginX, y: currentY, size: 10.5, font: fontBold });
        if (dateText) {
          const dWidth = fontRegular.widthOfTextAtSize(dateText, 9.5);
          page.drawText(dateText, { x: width - marginX - dWidth, y: currentY, size: 9.5, font: fontRegular });
        }
        currentY -= 13;

        const degreeText = [edu.degree, edu.major, edu.gpa ? `IPK: ${edu.gpa}` : null].filter(Boolean).join(', ');
        if (degreeText) {
          page.drawText(degreeText, { x: marginX, y: currentY, size: 9.5, font: fontItalic });
          currentY -= 15;
        }
      }
    }

    // 4. Experience
    if (Array.isArray(masterProfile.experience) && masterProfile.experience.length > 0) {
      drawSectionTitle('Pengalaman Kerja & Organisasi');
      for (const exp of masterProfile.experience) {
        checkPageOverflow(35);
        const orgText = exp.org || 'Perusahaan / Organisasi';
        const dateText = [exp.start, exp.end].filter(Boolean).join(' - ');

        page.drawText(orgText, { x: marginX, y: currentY, size: 10.5, font: fontBold });
        if (dateText) {
          const dWidth = fontRegular.widthOfTextAtSize(dateText, 9.5);
          page.drawText(dateText, { x: width - marginX - dWidth, y: currentY, size: 9.5, font: fontRegular });
        }
        currentY -= 13;

        if (exp.role) {
          page.drawText(exp.role, { x: marginX, y: currentY, size: 9.5, font: fontItalic });
          currentY -= 13;
        }

        if (Array.isArray(exp.bullets)) {
          for (const b of exp.bullets) {
            checkPageOverflow(16);
            const bulletPrefix = '•  ';
            const bulletText = `${bulletPrefix}${b}`;
            const words = bulletText.split(/\s+/);
            let bLine = '';

            for (const w of words) {
              const testLine = bLine ? `${bLine} ${w}` : w;
              const textWidth = fontRegular.widthOfTextAtSize(testLine, 9.5);
              if (textWidth > contentWidth) {
                checkPageOverflow(14);
                page.drawText(bLine, { x: marginX + 8, y: currentY, size: 9.5, font: fontRegular });
                currentY -= 12;
                bLine = w;
              } else {
                bLine = testLine;
              }
            }
            if (bLine) {
              checkPageOverflow(14);
              page.drawText(bLine, { x: marginX + 8, y: currentY, size: 9.5, font: fontRegular });
              currentY -= 14;
            }
          }
        }
        currentY -= 6;
      }
    }

    // 5. Skills
    if (masterProfile.skills) {
      drawSectionTitle('Keahlian & Kompetensi');
      const skillGroups = [];
      if (Array.isArray(masterProfile.skills.technical) && masterProfile.skills.technical.length > 0) {
        skillGroups.push(`Teknis: ${masterProfile.skills.technical.join(', ')}`);
      }
      if (Array.isArray(masterProfile.skills.tools) && masterProfile.skills.tools.length > 0) {
        skillGroups.push(`Tools & Software: ${masterProfile.skills.tools.join(', ')}`);
      }
      if (Array.isArray(masterProfile.skills.soft) && masterProfile.skills.soft.length > 0) {
        skillGroups.push(`Interpersonal: ${masterProfile.skills.soft.join(', ')}`);
      }
      if (Array.isArray(masterProfile.skills.languages) && masterProfile.skills.languages.length > 0) {
        skillGroups.push(`Bahasa: ${masterProfile.skills.languages.join(', ')}`);
      }

      for (const sg of skillGroups) {
        checkPageOverflow(14);
        page.drawText(sg, { x: marginX, y: currentY, size: 9.5, font: fontRegular });
        currentY -= 13;
      }
    }

    // Watermark footer jika akun FREE
    if (shouldWatermark) {
      const pages = pdfDoc.getPages();
      for (const p of pages) {
        const watermarkText = 'Dibuat dengan Lolos Kerja - Versi Gratis (Upgrade ke VIP untuk CV tanpa watermark)';
        const wWidth = fontItalic.widthOfTextAtSize(watermarkText, 8);
        p.drawText(watermarkText, {
          x: (width - wWidth) / 2,
          y: 20,
          size: 8,
          font: fontItalic,
          color: rgb(0.55, 0.55, 0.55)
        });
      }
    }

    const pdfBytes = await pdfDoc.save();

    if (returnJson || req.headers['accept']?.includes('application/json')) {
      const fileName = `CV_${(masterProfile.identity?.name || 'Kandidat').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      let storagePath = null;
      let signedUrl = null;

      if (authSession) {
        try {
          const supabase = getSupabaseAdmin();
          storagePath = `cv-pdf/${authSession.user.id}/${Date.now()}_${fileName}`;
          const { error: upErr } = await supabase.storage
            .from('cv-pdf')
            .upload(storagePath, Buffer.from(pdfBytes), { contentType: 'application/pdf', upsert: true });

          if (!upErr) {
            const { data: signData } = await supabase.storage.from('cv-pdf').createSignedUrl(storagePath, 86400 * 7);
            signedUrl = signData?.signedUrl;
          }
        } catch (stErr) {
          console.warn('Storage upload notice:', stErr.message);
        }
      }

      return res.status(200).json({
        success: true,
        url: signedUrl,
        path: storagePath,
        pages: pdfDoc.getPageCount(),
        size: pdfBytes.length,
        base64: Buffer.from(pdfBytes).toString('base64')
      });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="CV_Harvard_ATS_Lolos_Kerja.pdf"');
    res.setHeader('Content-Length', pdfBytes.length);
    return res.status(200).send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error('Export PDF Error:', err);
    return res.status(500).json({
      error: 'Gagal merender PDF Harvard ATS.',
      details: err.message
    });
  }
}
