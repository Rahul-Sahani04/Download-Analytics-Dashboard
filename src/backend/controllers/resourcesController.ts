import { Request, Response } from 'express';
import db from '../db/database';
import path from 'path';
import fs from 'fs';
import { QueryResult } from 'pg';

// Resource types
interface Resource {
  id: number;
  title: string;
  description: string | null;
  file_path: string;
  file_url: string | null;
  file_size: number;
  mime_type: string;
  uploaded_by: number | null;
  download_count: number;
  created_at: Date;
  updated_at: Date;
  metadata: {
    type: 'document' | 'video' | 'image' | 'audio' | 'presentation';
    [key: string]: any;
  } | null;
}

interface ResourceWithAuthor extends Resource {
  author_name: string | null;
}

interface Download {
  id: number;
  resource_id: number;
  user_id: number | null;
  ip_address: string;
  user_agent: string | null;
  bytes_transferred: number;
  status: string;
  country: string;
  city: string;
  download_date: Date;
}

// File types
type FileExtension = 'pdf' | 'doc' | 'docx' | 'xls' | 'xlsx' | 'ppt' | 'pptx' | 'txt' | 'md' | 'jpg' | 'jpeg' | 'png' | 'gif' | 'mp4' | 'mp3' | 'wav';

type MimeTypes = {
  [key: string]: readonly FileExtension[];
};

// File upload configuration
const UPLOAD_DIR = 'uploads/resources';
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const ALLOWED_FILE_TYPES: MimeTypes = {
  'application/pdf': ['pdf'],
  'application/msword': ['doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
  'application/vnd.ms-excel': ['xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['xlsx'],
  'application/vnd.ms-powerpoint': ['ppt'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['pptx'],
  'text/plain': ['txt'],
  'text/markdown': ['md'],
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/gif': ['gif'],
  'video/mp4': ['mp4'],
  'audio/mpeg': ['mp3'],
  'audio/wav': ['wav']
} as const;

interface FileUploadValidation {
  isValid: boolean;
  error?: string;
}

interface UploadedFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

interface FileUploadRequest extends Request {
  file?: UploadedFile;
}

interface SearchQueryParams {
  query: string;
  type: string;
  page: number;
  limit: number;
}

// Search endpoint
export const searchResources = async (req: Request, res: Response): Promise<void> => {
  try {

    // Extract query parameters
    const queryParams = req.query.params as unknown as SearchQueryParams;

    let { query, type, page, limit } = queryParams || {};

    // Validate and default query parameters
    query = query || '';
    type = type || 'all';
    page = Number(page) || 1;
    limit = Number(limit) || 10;

    if (page < 1) page = 1;
    if (limit < 1) limit = 10;
    if (limit > 100) limit = 100; // Limit to a maximum of 100 results

    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const params: any[] = [];
    let paramCount = 0;

    if (query) {
      paramCount++;
      params.push(`%${query}%`);
      conditions.push(`(LOWER(r.title) LIKE LOWER($${paramCount}) OR LOWER(r.description) LIKE LOWER($${paramCount}))`);
    }

    if (type && type !== 'all') {
      paramCount++;
      params.push(`${type}/%`);
      conditions.push(`r.mime_type LIKE $${paramCount}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*)::text as total
      FROM resources r
      ${whereClause}
    `;
    const { rows: [countResult] } = await db.query(countQuery, params);
    const total = parseInt(countResult.total, 10);

    // Get paginated results
    paramCount++;
    params.push(limit);
    paramCount++;
    params.push(offset);

    const resourcesQuery = `
      SELECT
        r.*,
        u.name as author_name
      FROM resources r
      LEFT JOIN users u ON r.uploaded_by = u.id
      ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT $${paramCount - 1}
      OFFSET $${paramCount}
    `;

    const { rows: resources }: QueryResult<ResourceWithAuthor> = await db.query(resourcesQuery, params);

    // Format response
    const formattedResources = resources.map(resource => ({
      id: resource.id,
      title: resource.title,
      description: resource.description,
      type: resource.mime_type.split('/')[0],
      fileName: path.basename(resource.file_path),
      fileSize: resource.file_size,
      fileUrl: resource.file_url,
      author: resource.author_name,
      downloadCount: resource.download_count,
      metadata: resource.metadata,
      createdAt: resource.created_at,
      updatedAt: resource.updated_at
    }));

    res.json({
      results: formattedResources,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error searching resources:', error);
    res.status(500).json({
      error: 'Failed to search resources',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
};


// File validation
const validateFileUpload = (file: UploadedFile): FileUploadValidation => {
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size exceeds limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`
    };
  }

  const mimeType = file.mimetype;
  const extension = path.extname(file.originalname).toLowerCase().slice(1) as FileExtension;
  
  const allowedExtensions = ALLOWED_FILE_TYPES[mimeType];
  if (!allowedExtensions?.includes(extension)) {
    const allExtensions = Object.values(ALLOWED_FILE_TYPES).flat();
    return {
      isValid: false,
      error: `Invalid file type. Allowed types: ${Array.from(new Set(allExtensions)).join(', ')}`
    };
  }

  return { isValid: true };
};

// File upload endpoint
export const uploadResource = async (req: FileUploadRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { title, description } = req.body;
    const userId = (req as any).user?.userId;

    const validation = validateFileUpload(req.file);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.error });
    }

    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }

    const extension = path.extname(req.file.originalname);
    const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}${extension}`;
    const filePath = path.join(UPLOAD_DIR, filename);

    fs.writeFileSync(filePath, req.file.buffer);

    const query = `
      INSERT INTO resources (
        title,
        description,
        file_path,
        file_size,
        mime_type,
        uploaded_by,
        metadata,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING *
    `;

    const metadata = {
      type: req.file.mimetype.split('/')[0],
      originalName: req.file.originalname
    };

    const values = [
      title || req.file.originalname,
      description || null,
      filePath,
      req.file.size,
      req.file.mimetype,
      userId ? Number(userId) : null,
      metadata
    ];

    const { rows: [resource] }: QueryResult<Resource> = await db.query(query, values);

    res.status(201).json(resource);
  } catch (error) {
    console.error('Error uploading resource:', error);
    res.status(500).json({
      error: 'Failed to upload resource',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
};

// Download endpoint
export const downloadResource = async (req: Request, res: Response) => {
  try {
    console.log('Download request received');
    const resourceId = Number(req.params.resourceId);
    const userId = (req as any).user?.userId;

    const { rows: [resource] }: QueryResult<Resource> = await db.query(
      'SELECT * FROM resources WHERE id = $1',
      [resourceId]
    );

    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    // Resolve the absolute file path
    const filePath = path.resolve(process.cwd(), resource.file_path);
    console.log('Attempting to download file:', filePath);
    
    if (!fs.existsSync(filePath)) {
      console.error('File not found at path:', filePath);
      return res.status(404).json({ error: 'File not found' });
    }

    // Get original filename from metadata or fallback to path basename
    const fileName = resource.metadata?.originalName || path.basename(filePath);

    // Set headers for download
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.setHeader('Content-Type', resource.mime_type);
    res.setHeader('Content-Length', resource.file_size);

    // Start the download
    const stream = fs.createReadStream(filePath);
    stream.on('error', (error) => {
      console.error('Stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to download resource' });
      }
    });

    stream.pipe(res);

    // Log the download after the stream ends successfully
    stream.on('end', async () => {
      try {
        const ipAddress = req.ip?.replace('::ffff:', '') || '0.0.0.0';
        
        await db.query(
          `INSERT INTO downloads (
            resource_id, user_id, ip_address, user_agent,
            bytes_transferred, status, country, city, download_date
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
          [
            resourceId,
            userId ? Number(userId) : null,
            ipAddress,
            req.headers['user-agent'] || null,
            resource.file_size,
            'completed',
            'Unknown',
            'Unknown'
          ]
        );

        await db.query(
          'UPDATE resources SET download_count = download_count + 1 WHERE id = $1',
          [resourceId]
        );
      } catch (error) {
        console.error('Error logging download:', error);
      }
    });
  } catch (error) {
    console.error('Error downloading resource:', error);
    res.status(500).json({
      error: 'Failed to download resource',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
};

// Get resource endpoint
export const getResource = async (req: Request, res: Response) => {
  try {
    const { resourceId } = req.params;

    const { rows: [resource] }: QueryResult<ResourceWithAuthor> = await db.query(
      `SELECT
        r.*,
        u.name as author_name
       FROM resources r
       LEFT JOIN users u ON r.uploaded_by = u.id
       WHERE r.id = $1`,
      [resourceId]
    );

    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    res.json({
      id: resource.id,
      title: resource.title,
      description: resource.description,
      type: resource.mime_type.split('/')[0],
      fileName: path.basename(resource.file_path),
      fileSize: resource.file_size,
      author: resource.author_name,
      downloadCount: resource.download_count,
      createdAt: resource.created_at,
      updatedAt: resource.updated_at
    });
  } catch (error) {
    console.error('Error getting resource:', error);
    res.status(500).json({
      error: 'Failed to get resource details',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
};

// Helper function
export const getAllowedFileTypes = () => {
  return {
    extensions: Object.values(ALLOWED_FILE_TYPES).flat(),
    maxSize: MAX_FILE_SIZE,
    mimeTypes: Object.keys(ALLOWED_FILE_TYPES)
  };
};