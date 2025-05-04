# File Storage System Template Documentation

This documentation provides a detailed guide on implementing a file storage system with PostgreSQL in your projects. The system supports file upload, download, and management functionalities.

## System Architecture

### Backend Components

1. **Database Layer**
```sql
CREATE TABLE files (
  id SERIAL PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  filepath VARCHAR(255) NOT NULL,
  mimetype VARCHAR(100) NOT NULL,
  size INT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

2. **Storage Structure**
- Files are stored in an `uploads` directory
- Database stores metadata and file paths
- Uses relative paths for portability

3. **Core Components**
- File Model (Database operations)
- File Controller (Business logic)
- File Routes (API endpoints)
- Multer Configuration (File upload handling)

## Implementation Guide

### 1. Database Setup

1. Install PostgreSQL and create a database:
```sql
CREATE DATABASE your_database_name;
```

2. Configure environment variables:
```env
PGUSER=postgres
PGHOST=localhost
PGPASSWORD=
PGDATABASE=filemanagement
PGPORT=5432
PORT=5000
```

### 2. Backend Implementation

1. **Initialize Project**
```bash
npm init -y
npm install express pg multer cors dotenv
```

2. **Create Upload Directory**
```javascript
// init.js
const fs = require('fs');
const path = require('path');

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
```

3. **Database Model**
```javascript
// models/fileModel.js
const db = require('../db');

const createTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS files (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) NOT NULL,
      filepath VARCHAR(255) NOT NULL,
      mimetype VARCHAR(100) NOT NULL,
      size INT NOT NULL,
      uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
};

module.exports = {
  saveFile: async (filename, filepath, mimetype, size) => {
    const result = await db.query(
      'INSERT INTO files (filename, filepath, mimetype, size) VALUES ($1, $2, $3, $4) RETURNING *',
      [filename, filepath, mimetype, size]
    );
    return result.rows[0];
  },
  getAllFiles: async () => {
    const result = await db.query('SELECT * FROM files ORDER BY uploaded_at DESC');
    return result.rows;
  },
  getFileById: async (id) => {
    const result = await db.query('SELECT * FROM files WHERE id = $1', [id]);
    return result.rows[0];
  }
};
```

4. **File Controller**
```javascript
// controllers/fileController.js
const path = require('path');
const fs = require('fs');
const fileModel = require('../models/fileModel');
const multer = require('multer');

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

module.exports = {
  uploadFile: upload.single('file'),
  
  handleUpload: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Store relative path in database
      const relativePath = path.relative(
        path.join(__dirname, '..'),
        req.file.path
      );

      const { filename, mimetype, size } = req.file;
      const savedFile = await fileModel.saveFile(
        filename,
        relativePath,
        mimetype,
        size
      );

      res.status(201).json({
        message: 'File uploaded successfully',
        file: savedFile
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Failed to upload file' });
    }
  },

  getAllFiles: async (req, res) => {
    try {
      const files = await fileModel.getAllFiles();
      res.json(files);
    } catch (error) {
      console.error('Error fetching files:', error);
      res.status(500).json({ error: 'Failed to fetch files' });
    }
  },

  downloadFile: async (req, res) => {
    try {
      const file = await fileModel.getFileById(req.params.id);
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }

      // Convert relative path to absolute path
      const absolutePath = path.join(__dirname, '..', file.filepath);

      if (!fs.existsSync(absolutePath)) {
        return res.status(404).json({ error: 'File not found on server' });
      }

      res.download(absolutePath, file.filename);
    } catch (error) {
      console.error('Download error:', error);
      res.status(500).json({ error: 'Failed to download file' });
    }
  }
};
```

### 3. Frontend Implementation

1. **File Upload Component**
```jsx
const FileUpload = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setIsUploading(true);
      const response = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      toast.success('File uploaded successfully!');
      setFile(null);
      onUploadSuccess();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="file"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <button
        type="submit"
        disabled={!file || isUploading}
      >
        {isUploading ? 'Uploading...' : 'Upload File'}
      </button>
    </form>
  );
};
```

2. **File List Component**
```jsx
const FileList = () => {
  const [files, setFiles] = useState([]);

  const fetchFiles = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/files');
      const data = await response.json();
      setFiles(data);
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  const handleDownload = async (id) => {
    try {
      window.location.href = `http://localhost:5000/api/files/${id}/download`;
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  return (
    <div>
      {files.map(file => (
        <div key={file.id}>
          <span>{file.filename}</span>
          <button onClick={() => handleDownload(file.id)}>
            Download
          </button>
        </div>
      ))}
    </div>
  );
};
```

## API Endpoints

1. **Upload File**
```
POST /api/upload
Content-Type: multipart/form-data
Body: file
```

2. **Get All Files**
```
GET /api/files
Response: Array of file objects
```

3. **Download File**
```
GET /api/files/:id/download
Response: File stream
```

## Integration Steps

1. Set up database and environment variables
2. Initialize upload directory
3. Implement backend components (model, controller, routes)
4. Set up frontend components
5. Configure CORS and other middleware
6. Test file upload and download functionality

## Security Considerations

1. File size limits
2. File type validation
3. Secure file paths
4. Authentication/Authorization
5. Rate limiting
6. Sanitize file names
7. Validate mime types

## Error Handling

1. File upload errors
2. Database errors
3. Storage errors
4. File not found
5. Invalid file types
6. Size limit exceeded

## Best Practices

1. Use relative paths for file storage
2. Implement proper error handling
3. Add file validation
4. Use environment variables for configuration
5. Implement proper logging
6. Regular cleanup of temporary files
7. Implement file type restrictions
8. Use secure file naming conventions

This template provides a foundation for implementing file storage functionality in any web application. Customize the implementation based on your specific requirements while maintaining the core architecture and security considerations.