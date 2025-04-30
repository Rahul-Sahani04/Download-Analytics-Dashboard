import { Pool } from 'pg';

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'analytics_db',
  password: process.env.DB_PASSWORD || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
});

export const db = {
  query: (text: string, params?: any[]) => pool.query(text, params),
  pool,
};

// Initialize database tables
const initDatabase = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        refresh_token TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Add initial admin and faculty users if they don't exist
      INSERT INTO users (name, email, password, role)
      SELECT 'Admin User', 'admin@example.com', 'password', 'admin'
      WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@example.com');

      INSERT INTO users (name, email, password, role)
      SELECT 'Faculty User', 'faculty@example.com', 'password', 'faculty'
      WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'faculty@example.com');
    `);
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

// Call initDatabase when the application starts
initDatabase().catch(console.error);

export default db;