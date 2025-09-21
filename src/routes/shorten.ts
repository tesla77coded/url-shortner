import express, { Request, Response } from 'express';
import { supabase } from '../lib/supabaseClient.js';
import { encodeBase62 } from '../lib/base62.js';
import { isValidUrl } from '../lib/urlValidator.js';
import rateLimiter from '../rateLimiter/middleware.js';

const router = express.Router();

const createLimiter = rateLimiter({ limit: 10, windowMs: 60_000 });

router.post('/shorten', createLimiter, async (req: Request, res: Response) => {
  const { longUrl, expiresInSeconds } = req.body as { longUrl?: string; expiresInSeconds?: number };
  if (!longUrl || !isValidUrl(longUrl)) {
    return res.status(400).json({ error: 'invalid longUrl' });
  }

  const { data: insertData, error: insertErr } = await supabase
    .from('urls')
    .insert({ long_url: longUrl })
    .select('id')
    .single();

  if (insertErr || !insertData?.id) {
    console.error('insert error', insertErr);
    return res.status(500).json({ error: 'db insert failure.' });
  }


  const id = insertData.id as number;
  const code = encodeBase62(id);

  const updatePayload: Record<string, any> = { code };
  if (typeof expiresInSeconds === 'number') {
    updatePayload.expires_at = new Date(Date.now() + expiresInSeconds * 1000).toISOString();
  }

  const { error: updateErr } = await supabase
    .from('urls')
    .update(updatePayload)
    .eq('id', id);


  if (updateErr) {
    console.error('update error', updateErr);
    return res.status(500).json({ error: 'db update failed.' });
  }

  return res.json({ code, shortUrl: `${process.env.BASE_URL}/${code}` });
});

export default router;
