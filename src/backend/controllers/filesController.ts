import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { db } from '../db/database';
import upload from '../middlewares/multer';

import { fileURLToPath } from 'url';
import { dirname } from 'path';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Individual controller functions
const uploadFile = upload.single('file');

const handleFileUpload = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can upload files' });
    }

    const { originalname, filename, mimetype, size } = req.file;
    const relativePath = path.relative(
      path.join(__dirname, '../../..'),
      req.file.path
    );

    const result = await db.query(
      `INSERT INTO resources (title, file_path, file_size, mime_type, uploaded_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [originalname, relativePath, size, mimetype, req.user.userId]
    );

    res.status(201).json({
      message: 'File uploaded successfully',
      resource: result.rows[0]
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
};

const getAllFiles = async (_req: Request, res: Response) => {
  try {
    const result = await db.query(
      `SELECT r.*, u.name as uploader_name 
       FROM resources r 
       LEFT JOIN users u ON r.uploaded_by = u.id 
       ORDER BY r.created_at DESC`
    );
    res.json(result.rows);
    console.log('Files fetched successfully');
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
};

const downloadFile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'SELECT * FROM resources WHERE id = $1',
      [id]
    );

    const resource = result.rows[0];
    if (!resource) {
      return res.status(404).json({ error: 'File not found' });
    }

    const absolutePath = path.join(__dirname, '../../..', resource.file_path);
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ error: 'File not found on server' });
    }

    // Update download count
    await db.query(
      'UPDATE resources SET download_count = download_count + 1 WHERE id = $1',
      [id]
    );

    // Record download in downloads table
    await db.query(
      `INSERT INTO downloads (resource_id, user_id, ip_address, user_agent, bytes_transferred, status)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        id,
        req.user?.userId || null,
        req.ip,
        req.get('user-agent'),
        resource.file_size,
        'completed'
      ]
    );

    res.download(absolutePath, resource.title);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
};

const deleteFile = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can delete files' });
    }

    const { id } = req.params;
    
    // Get file path before deletion
    const result = await db.query(
      'SELECT file_path FROM resources WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }

    const filePath = result.rows[0].file_path;
    const absolutePath = path.join(__dirname, '../../..', filePath);

    // Delete file from filesystem if it exists
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }

    // Delete from database
    await db.query('DELETE FROM resources WHERE id = $1', [id]);

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
};

// Export the controller object
export const filesController = {
  uploadFile,
  handleFileUpload,
  getAllFiles,
  downloadFile,
  deleteFile
};