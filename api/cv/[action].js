/**
 * api/cv/[action].js: Consolidated Router for CV Endpoints
 * Routes to modular handlers under api/_handlers/cv/
 * Node.js ESM Vercel Serverless Function
 */

import extractHandler from '../_handlers/cv/extract.js';
import analyzeHandler from '../_handlers/cv/analyze.js';
import rewriteHandler from '../_handlers/cv/rewrite.js';
import exportPdfHandler from '../_handlers/cv/export-pdf.js';
import saveHandler from '../_handlers/cv/save.js';

const routes = {
  extract: extractHandler,
  analyze: analyzeHandler,
  rewrite: rewriteHandler,
  'export-pdf': exportPdfHandler,
  save: saveHandler
};

export default async function handler(req, res) {
  const action = req.query?.action || (req.url ? new URL(req.url, 'http://localhost').pathname.split('/').pop() : '');
  const target = routes[action];
  if (!target) {
    return res.status(404).json({ error: `CV endpoint '${action}' not found` });
  }
  return target(req, res);
}
