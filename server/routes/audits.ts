import { Router, Request, Response } from 'express';
import { supabase } from '../db';

const router = Router();

// POST /api/audits — save an audit result
router.post('/', async (req: Request, res: Response) => {
  const audit = req.body;

  console.log('[audits] POST /api/audits', { id: audit?.id, hasRecommendations: !!audit?.recommendations });

  if (!audit?.id || !audit?.recommendations) {
    console.warn('[audits] Invalid payload:', { id: !!audit?.id, recommendations: !!audit?.recommendations });
    return res.status(400).json({ error: 'Invalid audit payload' });
  }

  try {
    console.log('[audits] Saving to Supabase:', { id: audit.id });
    const { error, data } = await supabase.from('audits').upsert({
      id: audit.id,
      data: audit,
      created_at: audit.createdAt ?? new Date().toISOString(),
    });

    if (error) {
      console.error('[audits] DB error:', { 
        message: error.message, 
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      return res.status(500).json({ error: 'Failed to save audit', details: error.message });
    }

    console.log('[audits] Successfully saved audit:', { id: audit.id, dataReturned: !!data });
    return res.status(200).json({ success: true, id: audit.id });
  } catch (err: unknown) {
    console.error('[audits] Unexpected error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/audits/:id — fetch a saved audit
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  console.log('[audits] GET /api/audits/:id', { id });

  try {
    const { data, error } = await supabase
      .from('audits')
      .select('data')
      .eq('id', id)
      .single();

    if (error) {
      console.warn('[audits] Query error:', error.message, { id });
      return res.status(404).json({ error: 'Audit not found' });
    }

    if (!data) {
      console.warn('[audits] No data returned:', { id });
      return res.status(404).json({ error: 'Audit not found' });
    }

    console.log('[audits] Successfully fetched audit:', { id });
    return res.status(200).json(data.data);
  } catch (err: unknown) {
    console.error('[audits] Unexpected error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
