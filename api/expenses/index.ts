import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from '../_db';
import { insertExpenseSchema } from '../../shared/schema';
import { randomUUID } from 'crypto';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const db = await getDb();

  if (req.method === 'GET') {
    try {
      const trackerId = req.query.trackerId as string;
      if (!trackerId) {
        return res.status(400).json({ message: 'Tracker ID required' });
      }

      const result = await db.query(
        'SELECT * FROM expenses WHERE tracker_id = $1 ORDER BY date DESC, created_at DESC',
        [trackerId]
      );

      const expenses = result.rows.map((row) => ({
        id: row.id,
        trackerId: row.tracker_id,
        amount: parseFloat(row.amount),
        category: row.category,
        description: row.description,
        date: row.date,
        createdAt: row.created_at,
      }));

      res.json(expenses);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Failed to fetch expenses' });
    }
  } else if (req.method === 'POST') {
    try {
      const data = insertExpenseSchema.parse(req.body);

      // Check if tracker exists
      const tracker = await db.query('SELECT * FROM trackers WHERE id = $1', [data.trackerId]);
      if (tracker.rows.length === 0) {
        return res.status(404).json({ message: 'Tracker not found' });
      }

      const id = randomUUID();
      const result = await db.query(
        'INSERT INTO expenses (id, tracker_id, amount, category, description, date, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [id, data.trackerId, data.amount, data.category, data.description || '', data.date, new Date().toISOString()]
      );

      const row = result.rows[0];
      const expense = {
        id: row.id,
        trackerId: row.tracker_id,
        amount: parseFloat(row.amount),
        category: row.category,
        description: row.description,
        date: row.date,
        createdAt: row.created_at,
      };

      res.json(expense);
    } catch (err: any) {
      if (err.errors) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error(err);
      res.status(500).json({ message: 'Failed to create expense' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
