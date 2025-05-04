import axios from 'axios';
import { apiClient } from './api-client';
import { FileMetadata, FileUploadResponse } from '@/backend/types/files';

interface DeleteResponse {
  message: string;
}

export const filesService = {
  uploadFile: async (file: File): Promise<FileUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    // Use axios directly for multipart form data
    const response = await axios.post<FileUploadResponse>(
      'http://localhost:3000/api/files/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`,
        },
      }
    );
    return response.data;
  },

  getAllFiles: async (): Promise<FileMetadata[]> => {
    return apiClient.get<FileMetadata[]>('/files');
  },

  downloadFile: async (id: number, filename: string): Promise<void> => {
    // Use axios directly for blob download
    const response = await axios.get<Blob>(
      `http://localhost:3000/api/files/download/${id}`,
      {
        responseType: 'blob',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`,
        },
      }
    );

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  deleteFile: async (id: number): Promise<DeleteResponse> => {
    return apiClient.delete<DeleteResponse>(`/files/${id}`);
  }
};