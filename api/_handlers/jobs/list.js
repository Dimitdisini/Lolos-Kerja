/**
 * /api/jobs/list.js: Curated Job Catalog with Clean Filtering & Real Pagination
 * Node.js ESM Vercel Serverless Function
 */

import { getSupabaseAdmin } from '../../_lib/auth.js';
import { applyRateLimit } from '../../_lib/rateLimit.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!applyRateLimit(req, res, { maxRequests: 60, windowMs: 60000 })) {
    return;
  }

  const {
    category,
    location,
    level,
    apply_via,
    q,
    page = '1',
    limit = '20'
  } = req.query || {};

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (pageNum - 1) * pageSize;

  try {
    const supabase = getSupabaseAdmin();

    let query = supabase
      .from('jobs')
      .select('id, title, company, location, level, category, majors, skills, apply_email, apply_url, apply_via, email_valid, posted_at, expires_at', { count: 'exact' })
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .order('posted_at', { ascending: false });

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    if (level && level !== 'all') {
      query = query.ilike('level', `%${level}%`);
    }

    if (apply_via && (apply_via === 'email' || apply_via === 'portal')) {
      query = query.eq('apply_via', apply_via);
    }

    if (location && location !== 'all') {
      query = query.ilike('location', `%${location}%`);
    }

    if (q && q.trim().length > 0) {
      const term = q.trim();
      query = query.or(`title.ilike.%${term}%,company.ilike.%${term}%,description.ilike.%${term}%`);
    }

    query = query.range(offset, offset + pageSize - 1);

    const { data: jobs, count, error } = await query;

    if (error) {
      console.error('Jobs Query Error:', error);
      return res.status(500).json({ error: 'Gagal memuat katalog loker.' });
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);

    return res.status(200).json({
      success: true,
      jobs: jobs || [],
      pagination: {
        page: pageNum,
        limit: pageSize,
        total,
        totalPages
      }
    });
  } catch (err) {
    console.error('Jobs List Handler Error:', err);
    return res.status(500).json({
      error: 'Terjadi kesalahan sistem saat mengambil data lowongan pekerjaan.',
      details: err.message
    });
  }
}
