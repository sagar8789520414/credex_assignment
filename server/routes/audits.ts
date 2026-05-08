import { Router, Request, Response } from 'express';
import { supabase } from '../db';

const router = Router();

// POST /api/audits — save an audit result
router.post('/', async (req: Request, res: Response) => {
  const audit = req.body;

  if (!audit?.id || !audit?.recommendations) {
    return res.status(400).json({ error: 'Invalid audit payload' });
  }

  try {
    const { error } = await supabase.from('audits').upsert({
      id: audit.id,
      data: audit,
      created_at: audit.createdAt ?? new Date().toISOString(),
    });

    if (error) {
      console.error('[audits] DB error:', error.message);
      return res.status(500).json({ error: 'Failed to save audit' });
    }

    return res.status(200).json({ success: true });
  } catch (err: unknown) {
    console.error('[audits] Unexpected error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/audits/:id — fetch a saved audit
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from('audits')
      .select('data')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Audit not found' });
    }

    return res.status(200).json(data.data);
  } catch (err: unknown) {
    console.error('[audits] Unexpected error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
