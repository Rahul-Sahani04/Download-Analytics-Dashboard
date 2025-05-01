import request from 'supertest';
import app from '../server';
import bcrypt from 'bcrypt';
import { db } from '../db/database';

describe('Auth Endpoints', () => {
  beforeAll(async () => {
    // Clear test database
    await db.query('DELETE FROM users');
    await db.query('DELETE FROM token_blacklist');
  });

  afterAll(async () => {
    await db.pool.end();
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash('test123', 10);
      await db.query(
        `INSERT INTO users (name, email, password, role, department)
         VALUES ($1, $2, $3, $4, $5)`,
        ['Test User', 'test@example.com', hashedPassword, 'admin', 'Test Dept']
      );
    });

    afterEach(async () => {
      await db.query('DELETE FROM users');
    });

    it('should login successfully with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'test123'
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user.email).toBe('test@example.com');
    });

    it('should fail with incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpass'
        });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error', 'Invalid credentials');
    });
  });

  describe('POST /api/auth/logout', () => {
    let token: string;

    beforeEach(async () => {
      // Create a user and get token
      const hashedPassword = await bcrypt.hash('test123', 10);
      const user = await db.query(
        `INSERT INTO users (name, email, password, role, department)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        ['Test User', 'test@example.com', hashedPassword, 'admin', 'Test Dept']
      );

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'test123'
        });

      token = res.body.accessToken;
    });

    afterEach(async () => {
      await db.query('DELETE FROM users');
      await db.query('DELETE FROM token_blacklist');
    });

    it('should logout successfully', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'Logged out successfully');

      // Verify token is blacklisted
      const blacklist = await db.query(
        'SELECT * FROM token_blacklist WHERE token = $1',
        [token]
      );
      expect(blacklist.rows).toHaveLength(1);
    });
  });
});