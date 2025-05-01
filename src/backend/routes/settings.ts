import express from 'express';
import { getUserSettings, updateProfile, updateSettings } from '../controllers/settingsController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get user settings
router.get('/', getUserSettings);

// Update user profile (including password)
router.put('/profile', updateProfile);

// Update user preferences and settings
router.put('/', updateSettings);

export default router;