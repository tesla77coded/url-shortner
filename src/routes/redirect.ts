import express, { Request, Response } from 'express';
import { supabase } from '../lib/supabaseClient.js';
import rateLimiter from '../rateLimiter/middleware.js';

const router = express.Router();
const redirectLimiter = rateLimiter({ limit: 1000, windowMs: 60_000 });

router.get('/:code', redirectLimiter, async (req: Request, res: Response) => {
  const { code } = req.params;

  const { data, error } = await supabase
    .from('urls')
    .select('id, long_url, expires_at, clicks')
    .eq('code', code)
    .maybeSingle();

  if (error || !data) return res.status(404).send('Not found.');
  if (data.expires_at && new Date(data.expires_at) < new Date()) return res.status(410).send('Expired.');


  // increment clicks (fire-and-forget)
  (async () => {
    try {
      await supabase
        .from('urls')
        .update({ clicks: (data.clicks ?? 0) + 1 })
        .eq('id', data.id);
    } catch (e: unknown) {
      console.error('click update failed', e);
    }
  })();

  return res.redirect(data.long_url);

})

export default router;
