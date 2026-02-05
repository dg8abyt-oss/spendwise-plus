import { Pool } from 'pg';

let pool: Pool | null = null;

export async function getDb(): Promise<Pool> {
  if (!pool) {
    // Use individual Supabase variables if available, otherwise fall back to connection string
    if (process.env.POSTGRES_HOST && process.env.POSTGRES_USER && process.env.POSTGRES_PASSWORD && process.env.POSTGRES_DATABASE) {
      pool = new Pool({
        host: process.env.POSTGRES_HOST,
        user: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        database: process.env.POSTGRES_DATABASE,
        port: 5432,
        ssl: { rejectUnauthorized: false },
      });
    } else {
      pool = new Pool({
        connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      });
    }

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
