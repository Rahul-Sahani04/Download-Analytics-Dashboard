import request from 'supertest';
import app from '../server';
import bcrypt from 'bcrypt';
import { db } from '../db/database';

describe('User Management', () => {
  let adminToken: string;
  
  beforeAll(async () => {
    // Clear test database
    await db.query('DELETE FROM users');
    
    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await db.query(
      `INSERT INTO users (name, email, password, role, department)
       VALUES ($1, $2, $3, $4, $5)`,
      ['Admin User', 'admin@test.com', hashedPassword, 'admin', 'Administration']
    );

    // Login to get admin token
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'admin123'
      });

    adminToken = res.body.accessToken;
  });

  afterAll(async () => {
    await db.query('DELETE FROM users');
    await db.pool.end();
  });

  describe('User CRUD Operations', () => {
    it('should create a new user', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test User',
          email: 'test@example.com',
          role: 'faculty',
          department: 'Computer Science'
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.email).toBe('test@example.com');
    });

    it('should validate user input', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'T', // too short
          email: 'invalid-email',
          role: 'invalid-role',
          department: ''
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'Validation failed');
    });

    it('should update user profile', async () => {
      // Create user first
      const user = await db.query(
        `INSERT INTO users (name, email, password, role, department)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        ['Update Test', 'update@test.com', 'password', 'faculty', 'Test Dept']
      );

      const res = await request(app)
        .put(`/api/users/${user.rows[0].id}/profile`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Name',
          department: 'Updated Dept'
        });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Updated Name');
      expect(res.body.department).toBe('Updated Dept');
    });

    it('should handle password reset request', async () => {
      const res = await request(app)
        .post('/api/users/password-reset/request')
        .send({
          email: 'update@test.com'
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message');
      
      // Verify reset token was set
      const user = await db.query(
        'SELECT reset_token FROM users WHERE email = $1',
        ['update@test.com']
      );
      expect(user.rows[0].reset_token).toBeTruthy();
    });

    it('should delete user', async () => {
      // Create user first
      const user = await db.query(
        `INSERT INTO users (name, email, password, role, department)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        ['Delete Test', 'delete@test.com', 'password', 'faculty', 'Test Dept']
      );

      const res = await request(app)
        .delete(`/api/users/${user.rows[0].id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      
      // Verify user was deleted
      const deletedUser = await db.query(
        'SELECT * FROM users WHERE id = $1',
        [user.rows[0].id]
      );
      expect(deletedUser.rows).toHaveLength(0);
    });
  });
});