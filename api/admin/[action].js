/**
 * api/admin/[action].js: Consolidated Router for Admin Command Center Endpoints
 * Routes to modular handlers under api/_handlers/admin/
 * Node.js ESM Vercel Serverless Function
 */

import overviewHandler from '../_handlers/admin/overview.js';

const routes = {
  overview: overviewHandler
};

export default async function handler(req, res) {
  const action = req.query?.action || (req.url ? new URL(req.url, 'http://localhost').pathname.split('/').pop() : '');
  const target = routes[action];
  if (!target) {
    return res.status(404).json({ error: `Admin endpoint '${action}' not found` });
  }
  return target(req, res);
}
