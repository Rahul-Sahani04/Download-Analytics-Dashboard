import { db } from './database';
import {
  createUsersTable,
  createUserIndexes,
  createResourcesTable,
  createResourceIndexes,
  createDownloadsTable,
  createDownloadIndexes
} from './schema';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

async function seed() {
  try {
    // Drop existing tables and sequences if they exist
    await db.query('DROP TABLE IF EXISTS downloads CASCADE');
    await db.query('DROP TABLE IF EXISTS resources CASCADE');
    await db.query('DROP TABLE IF EXISTS users CASCADE');
    await db.query('DROP SEQUENCE IF EXISTS downloads_id_seq CASCADE');
    await db.query('DROP SEQUENCE IF EXISTS resources_id_seq CASCADE');
    await db.query('DROP SEQUENCE IF EXISTS users_id_seq CASCADE');

    // Create tables and indexes
    await db.query(createUsersTable);
    await db.query(createUserIndexes);
    await db.query(createResourcesTable);
    await db.query(createResourceIndexes);
    await db.query(createDownloadsTable);
    await db.query(createDownloadIndexes);

    // Sample users data with role-specific settings
    const users = [
      {
        name: 'Admin User',
        email: 'admin@campus.edu',
        password: 'admin123',
        role: 'admin',
        department: 'Administration',
        settings: {
          analyticsEnabled: true,
          autoDownloadEnabled: true,
          emailNotifications: true,
          activityUpdates: true,
          newResourceAlerts: true,
          publicProfile: false,
          activityVisible: true,
          dataRetention: '1year'
        }
      },
      {
        name: 'Dr. Sarah Johnson',
        email: 'sarah.j@campus.edu',
        password: 'faculty123',
        role: 'faculty',
        department: 'Computer Science',
        settings: {
          analyticsEnabled: true,
          autoDownloadEnabled: false,
          emailNotifications: true,
          activityUpdates: true,
          newResourceAlerts: true,
          publicProfile: true,
          activityVisible: true,
          dataRetention: '6months'
        }
      },
      {
        name: 'Prof. Michael Chen',
        email: 'michael.c@campus.edu',
        password: 'faculty123',
        role: 'faculty',
        department: 'Engineering',
        settings: {
          analyticsEnabled: true,
          autoDownloadEnabled: false,
          emailNotifications: true,
          activityUpdates: true,
          newResourceAlerts: true,
          publicProfile: true,
          activityVisible: true,
          dataRetention: '6months'
        }
      },
      {
        name: 'Dr. Emily Williams',
        email: 'emily.w@campus.edu',
        password: 'faculty123',
        role: 'faculty',
        department: 'Physics',
        settings: {
          analyticsEnabled: true,
          autoDownloadEnabled: false,
          emailNotifications: true,
          activityUpdates: true,
          newResourceAlerts: true,
          publicProfile: true,
          activityVisible: true,
          dataRetention: '6months'
        }
      }
    ];

    // Insert users with hashed passwords and settings
    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      await db.query(
        `INSERT INTO users (name, email, password, role, department, settings) 
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (email) DO NOTHING`,
        [user.name, user.email, hashedPassword, user.role, user.department, user.settings]
      );
    }

    // Update some users' last_active times to create variety in status
    const timeQueries = [
      "UPDATE users SET last_active = NOW() WHERE role = 'admin'",
      "UPDATE users SET last_active = NOW() - INTERVAL '5 minutes' WHERE role = 'faculty'",
      "UPDATE users SET last_active = NOW() - INTERVAL '30 minutes' WHERE role = 'student'",
      "UPDATE users SET last_active = NOW() - INTERVAL '2 hours' WHERE role = 'staff'",
      "UPDATE users SET last_active = NOW() - INTERVAL '1 day' WHERE role = 'researcher'"
    ];

    for (const query of timeQueries) {
      await db.query(query);
    }

    // Seed resources from uploads/resources directory
    const resourcesDir = 'uploads/resources';
    const files = fs.readdirSync(resourcesDir);
    const adminUser = await db.query("SELECT id FROM users WHERE email = 'admin@campus.edu'");
    const adminId = adminUser.rows[0].id;

    for (const file of files) {
      const filePath = path.join(resourcesDir, file);
      const stats = fs.statSync(filePath);
      const ext = path.extname(file).toLowerCase();
      
      // Determine mime type based on extension
      const mimeTypes: { [key: string]: string } = {
        '.md': 'text/markdown',
        '.txt': 'text/plain',
        '.mp3': 'audio/mpeg'
      };

      const mimeType = mimeTypes[ext] || 'application/octet-stream';
      const title = path.basename(file, ext)
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      const metadata = {
        type: mimeType.split('/')[0],
        originalName: file
      };

      await db.query(
        `INSERT INTO resources (
          title,
          description,
          file_path,
          file_size,
          mime_type,
          uploaded_by,
          metadata,
          created_at,
          updated_at,
          download_count
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), $8)`,
        [
          title,
          `Resource file: ${title}`,
          filePath,
          stats.size,
          mimeType,
          adminId,
          metadata,
          Math.floor(Math.random() * 100) // Random download count for sample data
        ]
      );
    }

    console.log('✅ Database seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run the seed function if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seed()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { seed };