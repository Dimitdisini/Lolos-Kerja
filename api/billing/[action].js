/**
 * api/billing/[action].js: Consolidated Router for Billing & Order Endpoints
 * Routes to modular handlers under api/_handlers/billing/
 * Node.js ESM Vercel Serverless Function
 */

import createOrderHandler from '../_handlers/billing/create-order.js';
import webhookHandler from '../_handlers/billing/webhook.js';
import adminConfirmHandler from '../_handlers/billing/admin-confirm.js';

const routes = {
  'create-order': createOrderHandler,
  webhook: webhookHandler,
  'admin-confirm': adminConfirmHandler
};

export default async function handler(req, res) {
  const action = req.query?.action || (req.url ? new URL(req.url, 'http://localhost').pathname.split('/').pop() : '');
  const target = routes[action];
  if (!target) {
    return res.status(404).json({ error: `Billing endpoint '${action}' not found` });
  }
  return target(req, res);
}
