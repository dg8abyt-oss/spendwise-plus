import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from '../_db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { pin } = req.body;
    if (!pin || typeof pin !== 'string' || pin.length !== 4) {
      return res.status(400).json({ message: 'Invalid PIN format' });
    }

    const db = await getDb();
    const result = await db.query('SELECT * FROM users WHERE pin = $1', [pin]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid PIN' });
    }

    const row = result.rows[0];
    const user = {
      id: row.id,
      pin: row.pin,
      preferredCurrency: row.preferred_currency,
      createdAt: row.created_at,
    };

    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Login failed' });
  }
}
