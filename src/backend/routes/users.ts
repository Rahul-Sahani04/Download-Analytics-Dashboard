import express from 'express';
import { getUsers, addUser, updateUserStatus, deleteUser } from '../controllers/usersController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get all users (admin only)
router.get('/', requireRole(['admin']), getUsers);

// Add new user (admin only)
router.post('/', requireRole(['admin']), addUser);

// Update user status
router.put('/:userId/status', updateUserStatus);

// Delete user (admin only)
router.delete('/:userId', requireRole(['admin']), deleteUser);

export default router;