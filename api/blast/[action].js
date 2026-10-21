/**
 * api/blast/[action].js: Consolidated Router for Blast Engine Endpoints
 * Routes to modular handlers under api/_handlers/blast/
 * Node.js ESM Vercel Serverless Function
 */

import planHandler from '../_handlers/blast/plan.js';
import approveHandler from '../_handlers/blast/approve.js';
import updateHandler from '../_handlers/blast/update.js';
import statusHandler from '../_handlers/blast/status.js';
import tickHandler from '../_handlers/blast/tick.js';
import unsubscribeHandler from '../_handlers/blast/unsubscribe.js';
import webhookResendHandler from '../_handlers/blast/webhook-resend.js';

const routes = {
  plan: planHandler,
  approve: approveHandler,
  update: updateHandler,
  status: statusHandler,
  tick: tickHandler,
  unsubscribe: unsubscribeHandler,
  'webhook-resend': webhookResendHandler
};

export default async function handler(req, res) {
  const action = req.query?.action || (req.url ? new URL(req.url, 'http://localhost').pathname.split('/').pop() : '');
  const target = routes[action];
  if (!target) {
    return res.status(404).json({ error: `Blast endpoint '${action}' not found` });
  }
  return target(req, res);
}
