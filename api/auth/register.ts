import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from '../_db';
import { insertUserSchema } from '../../shared/schema';
import { randomUUID } from 'crypto';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const data = insertUserSchema.parse(req.body);
    const db = await getDb();
    
    const existing = await db.query('SELECT * FROM users WHERE pin = $1', [data.pin]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'This PIN is already in use' });
    }

    const id = randomUUID();
    const result = await db.query(
      'INSERT INTO users (id, pin, preferred_currency, created_at) VALUES ($1, $2, $3, $4) RETURNING *',
      [id, data.pin, data.preferredCurrency || 'USD', new Date().toISOString()]
    );

    const user = {
      id: result.rows[0].id,
      pin: result.rows[0].pin,
      preferredCurrency: result.rows[0].preferred_currency,
      createdAt: result.rows[0].created_at,
    };

    res.json({ user });
  } catch (err: any) {
    if (err.errors) {
      return res.status(400).json({ message: err.errors[0].message });
    }
    console.error(err);
    res.status(500).json({ message: 'Failed to create user' });
  }
}
