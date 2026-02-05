import type { User, Tracker, Expense, InsertUser, InsertTracker, InsertExpense } from "@shared/schema";
import { randomUUID } from "crypto";
import { Pool } from "pg";

let pool: Pool | null = null;

async function getDb(): Promise<Pool> {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    // Create tables if they don't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        pin VARCHAR(4) NOT NULL UNIQUE,
        preferred_currency VARCHAR(3) NOT NULL DEFAULT 'USD',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS trackers (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        currency VARCHAR(3) NOT NULL DEFAULT 'USD',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id VARCHAR(255) PRIMARY KEY,
        tracker_id VARCHAR(255) NOT NULL REFERENCES trackers(id) ON DELETE CASCADE,
        amount DECIMAL(12, 2) NOT NULL,
        category VARCHAR(255) NOT NULL,
        description TEXT DEFAULT '',
        date DATE NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
  }

  return pool;
}

export interface IStorage {
  getUserByPin(pin: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getTrackersByUserId(userId: string): Promise<Tracker[]>;
  getTrackerById(id: string): Promise<Tracker | undefined>;
  createTracker(userId: string, tracker: InsertTracker): Promise<Tracker>;
  deleteTracker(id: string): Promise<boolean>;
  
  getExpensesByTrackerId(trackerId: string): Promise<Expense[]>;
  getExpenseById(id: string): Promise<Expense | undefined>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  deleteExpense(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUserByPin(pin: string): Promise<User | undefined> {
    const db = await getDb();
    const result = await db.query('SELECT * FROM users WHERE pin = $1', [pin]);
    if (result.rows.length === 0) return undefined;
    const row = result.rows[0];
    return {
      id: row.id,
      pin: row.pin,
      preferredCurrency: row.preferred_currency,
      createdAt: row.created_at,
    };
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const db = await getDb();
    const id = randomUUID();
    const result = await db.query(
      'INSERT INTO users (id, pin, preferred_currency, created_at) VALUES ($1, $2, $3, $4) RETURNING *',
      [id, insertUser.pin, insertUser.preferredCurrency || 'USD', new Date().toISOString()]
    );
    const row = result.rows[0];
    return {
      id: row.id,
      pin: row.pin,
      preferredCurrency: row.preferred_currency,
      createdAt: row.created_at,
    };
  }

  async getTrackersByUserId(userId: string): Promise<Tracker[]> {
    const db = await getDb();
    const result = await db.query(
      'SELECT * FROM trackers WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      name: row.name,
      currency: row.currency,
      createdAt: row.created_at,
    }));
  }

  async getTrackerById(id: string): Promise<Tracker | undefined> {
    const db = await getDb();
    const result = await db.query('SELECT * FROM trackers WHERE id = $1', [id]);
    if (result.rows.length === 0) return undefined;
    const row = result.rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      currency: row.currency,
      createdAt: row.created_at,
    };
  }

  async createTracker(userId: string, insertTracker: InsertTracker): Promise<Tracker> {
    const db = await getDb();
    const id = randomUUID();
    const result = await db.query(
      'INSERT INTO trackers (id, user_id, name, currency, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [id, userId, insertTracker.name, insertTracker.currency, new Date().toISOString()]
    );
    const row = result.rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      currency: row.currency,
      createdAt: row.created_at,
    };
  }

  async deleteTracker(id: string): Promise<boolean> {
    const db = await getDb();
    const result = await db.query('DELETE FROM trackers WHERE id = $1 RETURNING *', [id]);
    return result.rows.length > 0;
  }

  async getExpensesByTrackerId(trackerId: string): Promise<Expense[]> {
    const db = await getDb();
    const result = await db.query(
      'SELECT * FROM expenses WHERE tracker_id = $1 ORDER BY date DESC, created_at DESC',
      [trackerId]
    );
    return result.rows.map((row) => ({
      id: row.id,
      trackerId: row.tracker_id,
      amount: parseFloat(row.amount),
      category: row.category,
      description: row.description,
      date: row.date,
      createdAt: row.created_at,
    }));
  }

  async getExpenseById(id: string): Promise<Expense | undefined> {
    const db = await getDb();
    const result = await db.query('SELECT * FROM expenses WHERE id = $1', [id]);
    if (result.rows.length === 0) return undefined;
    const row = result.rows[0];
    return {
      id: row.id,
      trackerId: row.tracker_id,
      amount: parseFloat(row.amount),
      category: row.category,
      description: row.description,
      date: row.date,
      createdAt: row.created_at,
    };
  }

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const db = await getDb();
    const id = randomUUID();
    const result = await db.query(
      'INSERT INTO expenses (id, tracker_id, amount, category, description, date, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [id, insertExpense.trackerId, insertExpense.amount, insertExpense.category, insertExpense.description || '', insertExpense.date, new Date().toISOString()]
    );
    const row = result.rows[0];
    return {
      id: row.id,
      trackerId: row.tracker_id,
      amount: parseFloat(row.amount),
      category: row.category,
      description: row.description,
      date: row.date,
      createdAt: row.created_at,
    };
  }

  async deleteExpense(id: string): Promise<boolean> {
    const db = await getDb();
    const result = await db.query('DELETE FROM expenses WHERE id = $1 RETURNING *', [id]);
    return result.rows.length > 0;
  }
}

export const storage = new DatabaseStorage();
