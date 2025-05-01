import { Request, Response } from 'express';
import { sql } from '../db/database';
import bcrypt from 'bcryptjs';
import { hashPassword } from './authController';

export const getUserSettings = async (req: Request, res: Response) => {
  try {
    // Debug logging
    console.log('Auth headers:', req.headers.authorization);
    console.log('User object:', req.user);
    
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User ID not found in token' });
    }
    
    const [user] = await sql`
      SELECT 
        name,
        email,
        role,
        department,
        settings->>'analyticsEnabled' as "analyticsEnabled",
        settings->>'autoDownloadEnabled' as "autoDownloadEnabled",
        settings->>'emailNotifications' as "emailNotifications",
        settings->>'activityUpdates' as "activityUpdates",
        settings->>'newResourceAlerts' as "newResourceAlerts",
        settings->>'publicProfile' as "publicProfile",
        settings->>'activityVisible' as "activityVisible",
        settings->>'dataRetention' as "dataRetention"
      FROM users
      WHERE id = ${userId}
    `;

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Convert string 'true'/'false' to boolean
    const settings = {
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      analyticsEnabled: user.analyticsEnabled === 'true',
      autoDownloadEnabled: user.autoDownloadEnabled === 'true',
      emailNotifications: user.emailNotifications === 'true',
      activityUpdates: user.activityUpdates === 'true',
      newResourceAlerts: user.newResourceAlerts === 'true',
      publicProfile: user.publicProfile === 'true',
      activityVisible: user.activityVisible === 'true',
      dataRetention: user.dataRetention || '6months'
    };

    res.json({ data: settings });
  } catch (error) {
    console.error('Error getting user settings:', error);
    res.status(500).json({ 
      error: 'Failed to get settings',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { name, email, department, currentPassword, newPassword } = req.body;

    // If updating password, verify current password
    if (currentPassword && newPassword) {
      const [user] = await sql`
        SELECT password FROM users WHERE id = ${userId}
      `;

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const validPassword = await bcrypt.compare(currentPassword, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      const hashedPassword = await hashPassword(newPassword);
      await sql`
        UPDATE users
        SET password = ${hashedPassword}
        WHERE id = ${userId}
      `;
    }

    // Update profile fields
    await sql`
      UPDATE users
      SET
        name = COALESCE(${name}, name),
        email = COALESCE(${email}, email),
        department = COALESCE(${department}, department),
        updated_at = NOW()
      WHERE id = ${userId}
    `;

    res.json({
      data: { message: 'Profile updated successfully' }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ 
      error: 'Failed to update profile',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
};

export const updateSettings = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { preferences, notifications, privacy } = req.body;

    // Update settings JSON field
    await sql`
      UPDATE users
      SET
        settings = settings || ${sql.json({
          ...preferences,
          ...notifications,
          ...privacy
        })},
        updated_at = NOW()
      WHERE id = ${userId}
    `;

    res.json({
      data: { message: 'Settings updated successfully' }
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ 
      error: 'Failed to update settings',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
};