import { QueryResult } from 'pg';

export interface FileMetadata {
    id: number;
    title: string;
    description: string | null;
    file_path: string;
    file_url: string | null;
    file_size: string;
    mime_type: string;
    uploaded_by: number;
    download_count: number;
    created_at: Date | string;
    updated_at: Date | string;
    metadata: any | null;
    uploader_name: string;
  }

export interface FileUploadResponse {
  message: string;
  file: FileMetadata;
}

export interface FileError {
  error: string;
}

export type FileResponse = FileUploadResponse | FileError;

export type FileQueryResult = QueryResult<FileMetadata>;