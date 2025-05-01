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

// Test database connection
const testConnection = async () => {
  try {
    await db.query('SELECT NOW()');
    console.log('Database connection successful');
  } catch (error) {
    console.error('Error connecting to database:', error);
    throw error;
  }
};

// Test connection when the application starts
testConnection().catch(console.error);

export default db;