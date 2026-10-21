/**
 * api/account/[action].js: Consolidated Router for Account & Privacy Endpoints
 * Routes to modular handlers under api/_handlers/account/
 * Node.js ESM Vercel Serverless Function
 */

import exportHandler from '../_handlers/account/export.js';
import deleteHandler from '../_handlers/account/delete.js';

const routes = {
  export: exportHandler,
  delete: deleteHandler
};

export default async function handler(req, res) {
  const action = req.query?.action || (req.url ? new URL(req.url, 'http://localhost').pathname.split('/').pop() : '');
  const target = routes[action];
  if (!target) {
    return res.status(404).json({ error: `Account endpoint '${action}' not found` });
  }
  return target(req, res);
}
