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
PGPASSWORD=your_password
PGDATABASE=your_database_name
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

// Create .gitkeep to ensure directory is tracked
const gitkeepPath = path.join(uploadDir, '.gitkeep');
if (!fs.existsSync(gitkeepPath)) {
  fs.writeFileSync(gitkeepPath, '');
}
```

3. **Database Model**
```javascript
// models/fileModel.js
const db = require('../db');

const createTable = async () => {
  try {
    // Drop the existing table if it exists with wrong schema
    await db.query('DROP TABLE IF EXISTS files');
    
    // Create the table with the correct schema
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
  } catch (error) {
    console.error('Error creating table:', error);
    throw error;
  }
};

createTable();

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
import { useState } from 'react';
import { FiUpload, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';

const FileUpload = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

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
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      toast.success('File uploaded successfully!');
      setFile(null);
      document.getElementById('file-upload').value = '';
      onUploadSuccess();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    document.getElementById('file-upload').value = '';
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Choose a file to upload
        </label>
        <div className="flex items-center gap-2">
          <input
            id="file-upload"
            type="file"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
        </div>
      </div>

      {file && (
        <div className="mb-4 p-3 bg-gray-50 rounded-md flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FiUpload className="text-gray-500" />
            <span className="text-sm text-gray-700">{file.name}</span>
            <span className="text-xs text-gray-500">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </span>
          </div>
          <button
            type="button"
            onClick={removeFile}
            className="text-gray-500 hover:text-red-500"
          >
            <FiX />
          </button>
        </div>
      )}

      <button
        type="submit"
        disabled={!file || isUploading}
        className={`w-full py-2 px-4 rounded-md text-white font-medium ${
          isUploading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
        } disabled:bg-gray-300 disabled:cursor-not-allowed`}
      >
        {isUploading ? 'Uploading...' : 'Upload File'}
      </button>
    </form>
  );
};
```

2. **File List Component**
```jsx
import { FiDownload, FiFile } from 'react-icons/fi';
import toast from 'react-hot-toast';

const FileList = ({ files }) => {
  const handleDownload = async (fileId, filename) => {
    try {
      const response = await fetch(`http://localhost:5000/api/files/${fileId}/download`);
      
      if (!response.ok) {
        throw new Error('Download failed');
      }

      // Create a blob from the response
      const blob = await response.blob();
      
      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary anchor element to trigger the download
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Download started!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download file');
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (files.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No files uploaded yet. Upload your first file above.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              File
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Size
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Uploaded
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {files.map((file) => (
            <tr key={file.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <FiFile className="flex-shrink-0 h-5 w-5 text-gray-400" />
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">{file.filename}</div>
                    <div className="text-sm text-gray-500">{file.mimetype}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatFileSize(file.size)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(file.uploaded_at)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button
                  onClick={() => handleDownload(file.id, file.filename)}
                  className="text-blue-600 hover:text-blue-900 mr-4 flex items-center"
                >
                  <FiDownload className="mr-1" /> Download
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

3. **Main App Component**
```jsx
import { useState, useEffect } from 'react';
import FileUpload from './components/FileUpload';
import FileList from './components/FileList';
import { Toaster } from 'react-hot-toast';

function App() {
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:5000/api/files');
      const data = await response.json();
      setFiles(data);
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadSuccess = () => {
    fetchFiles();
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
          File Upload App
        </h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <FileUpload onUploadSuccess={handleUploadSuccess} />
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Uploaded Files
          </h2>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            </div>
          ) : (
            <FileList files={files} />
          )}
        </div>
      </div>
      <Toaster position="bottom-right" />
    </div>
  );
}
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