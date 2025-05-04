import express from 'express';
import upload from '../middlewares/multer';
import { filesController } from '../controllers/filesController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = express.Router();

// Protect all file routes with authentication
router.use(authenticateToken);

// Upload a file (admin only)
router.post('/upload',
  requireRole(['admin']),
  filesController.uploadFile,
  filesController.handleFileUpload
);

// Get all files (available to all authenticated users)
router.get('/', filesController.getAllFiles);

// Download a file (available to all authenticated users)
router.get('/download/:id', filesController.downloadFile);

// Delete a file (admin only)
router.delete('/:id',
  requireRole(['admin']),
  filesController.deleteFile
);

export default router;