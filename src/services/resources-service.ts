import { apiClient } from './api-client';
import { AxiosResponse } from 'axios';

interface Resource {
  id: string;
  title: string;
  description: string;
  type: string;
  fileName: string;
  fileSize: number;
  author: string;
  downloadCount: number;
  createdAt: string;
  updatedAt: string;
}

export const getResource = async (resourceId: string): Promise<Resource> => {
  const response: AxiosResponse<Resource> = await apiClient.get(`/resources/${resourceId}`);
  return response.data;
};

export const downloadResource = async (resourceId: string): Promise<void> => {
  const response: AxiosResponse<Blob> = await apiClient.get(`/resources/${resourceId}/download`, {
    responseType: 'blob'
  });
  
  // Create a URL for the blob
  const url = window.URL.createObjectURL(new Blob([response.data]));
  
  // Create a temporary link element
  const link = document.createElement('a');
  link.href = url;
  
  // Try to get filename from Content-Disposition header or fallback to resourceId
  let fileName = `resource-${resourceId}`;
  const contentDisposition = response.headers['content-disposition'];
  if (contentDisposition) {
    const match = contentDisposition.match(/filename="(.+)"/);
    if (match) {
      fileName = match[1];
    }
  }
  
  link.setAttribute('download', fileName);
  
  // Append to body, click, and cleanup
  document.body.appendChild(link);
  link.click();
  link.parentNode?.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const openResource = async (resourceId: string): Promise<void> => {
  const resource = await getResource(resourceId);
  window.open(resource.fileName, '_blank');
};

export const resourcesService = {
  getResource,
  downloadResource,
  openResource,
};

export default resourcesService;