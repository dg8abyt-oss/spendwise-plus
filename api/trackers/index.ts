import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from '../_db';
import { insertTrackerSchema } from '../../shared/schema';
import { randomUUID } from 'crypto';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const db = await getDb();

  if (req.method === 'GET') {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ message: 'User ID required' });
      }

      const result = await db.query(
        'SELECT * FROM trackers WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );

      const trackers = result.rows.map((row) => ({
        id: row.id,
        userId: row.user_id,
        name: row.name,
        currency: row.currency,
        createdAt: row.created_at,
      }));

      res.json(trackers);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Failed to fetch trackers' });
    }
  } else if (req.method === 'POST') {
    try {
      const { userId, ...trackerData } = req.body;
      if (!userId) {
        return res.status(400).json({ message: 'User ID required' });
      }

      const data = insertTrackerSchema.parse(trackerData);
      const id = randomUUID();

      const result = await db.query(
        'INSERT INTO trackers (id, user_id, name, currency, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [id, userId, data.name, data.currency, new Date().toISOString()]
      );

      const row = result.rows[0];
      const tracker = {
        id: row.id,
        userId: row.user_id,
        name: row.name,
        currency: row.currency,
        createdAt: row.created_at,
      };

      res.json(tracker);
    } catch (err: any) {
      if (err.errors) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error(err);
      res.status(500).json({ message: 'Failed to create tracker' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
