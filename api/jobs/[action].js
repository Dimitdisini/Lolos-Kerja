/**
 * api/jobs/[action].js: Consolidated Router for Job Catalog Endpoints
 * Routes to modular handlers under api/_handlers/jobs/
 * Node.js ESM Vercel Serverless Function
 */

import listHandler from '../_handlers/jobs/list.js';
import matchHandler from '../_handlers/jobs/match.js';

const routes = {
  list: listHandler,
  match: matchHandler
};

export default async function handler(req, res) {
  const action = req.query?.action || (req.url ? new URL(req.url, 'http://localhost').pathname.split('/').pop() : '');
  const target = routes[action];
  if (!target) {
    return res.status(404).json({ error: `Jobs endpoint '${action}' not found` });
  }
  return target(req, res);
}
