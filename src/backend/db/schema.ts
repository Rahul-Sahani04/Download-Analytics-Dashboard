export const createDownloadsTable = `
  CREATE SEQUENCE IF NOT EXISTS downloads_id_seq;
  CREATE TABLE IF NOT EXISTS downloads (
    id INTEGER PRIMARY KEY DEFAULT nextval('downloads_id_seq'),
    resource_id INTEGER REFERENCES resources(id),
    user_id INTEGER REFERENCES users(id),
    ip_address VARCHAR(45),
    user_agent TEXT,
    bytes_transferred BIGINT,
    status VARCHAR(50),
    country VARCHAR(100),
    city VARCHAR(100),
    download_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  )
`;

export const dropDownloadsTable = `
  DROP TABLE IF EXISTS downloads CASCADE
`;

export const createDownloadIndexes = `
  CREATE INDEX IF NOT EXISTS idx_downloads_resource ON downloads(resource_id);
  CREATE INDEX IF NOT EXISTS idx_downloads_user ON downloads(user_id);
  CREATE INDEX IF NOT EXISTS idx_downloads_date ON downloads(download_date);
  CREATE INDEX IF NOT EXISTS idx_downloads_location ON downloads(country, city);
`;

export const createResourcesTable = `
  CREATE SEQUENCE IF NOT EXISTS resources_id_seq;
  CREATE TABLE IF NOT EXISTS resources (
    id INTEGER PRIMARY KEY DEFAULT nextval('resources_id_seq'),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_path VARCHAR(1000),
    file_url VARCHAR(1000),
    file_size BIGINT,
    mime_type VARCHAR(100),
    uploaded_by INTEGER REFERENCES users(id),
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
  )
`;

export const dropResourcesTable = `
  DROP TABLE IF EXISTS resources CASCADE
`;

export const createResourceIndexes = `
  CREATE INDEX IF NOT EXISTS idx_resources_title ON resources(title);
  CREATE INDEX IF NOT EXISTS idx_resources_created_at ON resources(created_at);
  CREATE INDEX IF NOT EXISTS idx_resources_download_count ON resources(download_count);
  CREATE INDEX IF NOT EXISTS idx_resources_mime_type ON resources(mime_type);
  CREATE INDEX IF NOT EXISTS idx_resources_uploaded_by ON resources(uploaded_by);
`;

export const createUsersTable = `
  CREATE SEQUENCE IF NOT EXISTS users_id_seq;
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY DEFAULT nextval('users_id_seq'),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'student',
    department VARCHAR(100) NOT NULL,
    refresh_token TEXT,
    settings JSONB DEFAULT '{
      "analyticsEnabled": false,
      "autoDownloadEnabled": false,
      "emailNotifications": true,
      "activityUpdates": true,
      "newResourceAlerts": false,
      "publicProfile": false,
      "activityVisible": true,
      "dataRetention": "6months"
    }'::jsonb,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  )
`;

export const dropUsersTable = `
  DROP TABLE IF EXISTS users CASCADE
`;

// Indexes
export const createUserIndexes = `
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
  CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active);
  CREATE INDEX IF NOT EXISTS idx_users_settings ON users USING gin (settings);
`;