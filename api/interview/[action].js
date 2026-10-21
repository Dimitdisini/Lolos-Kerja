/**
 * api/interview/[action].js: Consolidated Router for Voice Interview Endpoints
 * Routes to modular handlers under api/_handlers/interview/
 * Node.js ESM Vercel Serverless Function
 */

import questionsHandler from '../_handlers/interview/questions.js';
import scoreHandler from '../_handlers/interview/score.js';

const routes = {
  questions: questionsHandler,
  score: scoreHandler
};

export default async function handler(req, res) {
  const action = req.query?.action || (req.url ? new URL(req.url, 'http://localhost').pathname.split('/').pop() : '');
  const target = routes[action];
  if (!target) {
    return res.status(404).json({ error: `Interview endpoint '${action}' not found` });
  }
  return target(req, res);
}
