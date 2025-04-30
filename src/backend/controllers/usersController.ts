import { Request, Response } from 'express';
import { db } from '../db/database';

export const getUsers = async (req: Request, res: Response) => {
  try {
    const result = await db.query(`
      SELECT 
        id, 
        name, 
        email, 
        role, 
        department,
        CASE 
          WHEN last_active > NOW() - INTERVAL '10 minutes' THEN 'Active'
          WHEN last_active > NOW() - INTERVAL '1 hour' THEN 'Away'
          ELSE 'Inactive'
        END as status,
        CASE
          WHEN last_active > NOW() - INTERVAL '1 minute' THEN 'Just now'
          WHEN last_active > NOW() - INTERVAL '1 hour' THEN extract(minute from NOW() - last_active)::text || ' mins ago'
          WHEN last_active > NOW() - INTERVAL '1 day' THEN extract(hour from NOW() - last_active)::text || ' hours ago'
          ELSE extract(day from NOW() - last_active)::text || ' days ago'
        END as last_active
      FROM users
      ORDER BY last_active DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

export const addUser = async (req: Request, res: Response) => {
  try {
    const { name, email, role, department } = req.body;

    if (!name || !email || !role || !department) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await db.query(
      `INSERT INTO users (name, email, role, department, last_active)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id, name, email, role, department`,
      [name, email, role, department]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding user:', error);
    res.status(500).json({ error: 'Failed to add user' });
  }
};

export const updateUserStatus = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    if (status === 'Active') {
      await db.query(
        'UPDATE users SET last_active = NOW() WHERE id = $1',
        [userId]
      );
    }

    const result = await db.query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const result = await db.query(
      'DELETE FROM users WHERE id = $1 RETURNING *',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};