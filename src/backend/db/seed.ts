import { db } from './database';
import { createUsersTable, createUserIndexes } from './schema';
import * as bcrypt from 'bcrypt';

async function seed() {
  try {
    // Create tables and indexes
    await db.query(createUsersTable);
    await db.query(createUserIndexes);

    // Sample users data
    const users = [
      {
        name: 'Admin User',
        email: 'admin@campus.edu',
        password: 'admin123',
        role: 'admin',
        department: 'Administration'
      },
      {
        name: 'Dr. Sarah Johnson',
        email: 'sarah.j@campus.edu',
        password: 'faculty123',
        role: 'faculty',
        department: 'Computer Science'
      },
      {
        name: 'Prof. Michael Chen',
        email: 'michael.c@campus.edu',
        password: 'faculty123',
        role: 'faculty',
        department: 'Engineering'
      },
      {
        name: 'Dr. Emily Williams',
        email: 'emily.w@campus.edu',
        password: 'faculty123',
        role: 'faculty',
        department: 'Physics'
      },
      {
        name: 'John Smith',
        email: 'john.s@campus.edu',
        password: 'student123',
        role: 'student',
        department: 'Computer Science'
      },
      {
        name: 'Maria Garcia',
        email: 'maria.g@campus.edu',
        password: 'student123',
        role: 'student',
        department: 'Engineering'
      },
      {
        name: 'David Lee',
        email: 'david.l@campus.edu',
        password: 'staff123',
        role: 'staff',
        department: 'Library'
      },
      {
        name: 'James Wilson',
        email: 'james.w@campus.edu',
        password: 'researcher123',
        role: 'researcher',
        department: 'Physics'
      }
    ];

    // Insert users with hashed passwords
    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      await db.query(
        `INSERT INTO users (name, email, password, role, department) 
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (email) DO NOTHING`,
        [user.name, user.email, hashedPassword, user.role, user.department]
      );
    }

    // Update some users' last_active times to create variety in status
    const timeQueries = [
      "UPDATE users SET last_active = NOW() WHERE role = 'admin'",
      "UPDATE users SET last_active = NOW() - INTERVAL '5 minutes' WHERE role = 'faculty' LIMIT 1",
      "UPDATE users SET last_active = NOW() - INTERVAL '30 minutes' WHERE role = 'student' LIMIT 1",
      "UPDATE users SET last_active = NOW() - INTERVAL '2 hours' WHERE role = 'staff'",
      "UPDATE users SET last_active = NOW() - INTERVAL '1 day' WHERE role = 'researcher'"
    ];

    for (const query of timeQueries) {
      await db.query(query);
    }

    console.log('✅ Database seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run the seed function if this file is executed directly
if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { seed };