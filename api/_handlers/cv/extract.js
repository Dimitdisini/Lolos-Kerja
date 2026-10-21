/**
 * /api/cv/extract.js: Document Text Extraction & Scanned Document OCR Detector
 * Extracts text from plain text, PDF, and DOCX buffers.
 * Node.js ESM format
 */

import { applyRateLimit } from '../../_lib/rateLimit.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!applyRateLimit(req, res, { maxRequests: 30, windowMs: 60000 })) {
    return;
  }

  const { content, filename = 'cv.txt', mimeType = 'text/plain' } = req.body || {};

  if (!content || typeof content !== 'string') {
    return res.status(400).json({ error: 'Data konten dokumen tidak ditemukan atau kosong.' });
  }

  try {
    let rawText = '';
    let needsOcr = false;
    let decodedContent = content;

    // Handle base64 Data URL (e.g. data:application/pdf;base64,JVBERi0...)
    if (content.startsWith('data:')) {
      const base64Index = content.indexOf(';base64,');
      if (base64Index !== -1) {
        const base64Data = content.slice(base64Index + 8);
        const buffer = Buffer.from(base64Data, 'base64');
        decodedContent = buffer.toString('latin1');
      }
    }

    if (mimeType.includes('pdf') || filename.endsWith('.pdf') || decodedContent.startsWith('%PDF')) {
      // PDF stream text extraction: extract readable string sequences
      // Look for text streams in PDF objects
      const streamMatches = decodedContent.match(/stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g);
      let extractedChunks = [];
      if (streamMatches) {
        for (const st of streamMatches) {
          const readable = st.match(/[\w\s.,;:()\-–—@/]{4,}/g);
          if (readable) extractedChunks.push(...readable);
        }
      }
      
      const fallbackMatches = decodedContent.match(/[\w\s.,;:()\-–—@/]{4,}/g) || [];
      const combined = extractedChunks.length > 0 ? extractedChunks.join(' ') : fallbackMatches.join(' ');
      
      // Filter out PDF internal syntax tokens
      rawText = combined
        .replace(/obj[\s\S]*?endobj/g, '')
        .replace(/xref[\s\S]*?trailer/g, '')
        .replace(/\b(Type|Catalog|Pages|Font|Length|Filter|FlateDecode)\b/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      // If PDF has virtually no extractable text, it's a scanned image
      if (rawText.length < 50 && decodedContent.length > 500) {
        needsOcr = true;
      }
    } else {
      // Plain text or pre-extracted content
      rawText = content.trim();
    }

    const charCount = rawText.length;
    const wordCount = rawText.split(/\s+/).filter(Boolean).length;

    return res.status(200).json({
      success: true,
      rawText,
      charCount,
      wordCount,
      needsOcr,
      filename
    });
  } catch (err) {
    console.error('[CV Extract Error]:', err);
    return res.status(500).json({
      error: 'Gagal mengekstrak teks dari berkas dokumen.',
      details: err.message
    });
  }
}
