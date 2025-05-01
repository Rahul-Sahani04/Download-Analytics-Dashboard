import { apiClient } from './api-client';
import { AxiosResponse } from 'axios';

interface Resource {
  id: number;
  title: string;
  description: string | null;
  type: string;
  fileName: string;
  fileSize: number;
  author: string | null;
  downloadCount: number;
  createdAt: string;
  updatedAt: string;
}

interface SearchResponse {
  results: Resource[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export const getResource = async (resourceId: string): Promise<Resource> => {
  const response: AxiosResponse<Resource> = await apiClient.get(`/resources/${resourceId}`);
  return response.data;
};

export const downloadResource = async (resourceId: string): Promise<void> => {
  try {
    const response: AxiosResponse<Blob> = await apiClient.get(`/resources/${resourceId}/download`, {
      responseType: 'blob'
    });
    
    // Create a URL for the blob
    const blob = new Blob([response.data], { type: response.headers['content-type'] });
    const url = window.URL.createObjectURL(blob);
    
    // Get filename from Content-Disposition header
    let fileName = `resource-${resourceId}`;
    const contentDisposition = response.headers['content-disposition'];
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="([^"]+)"/);
      if (match) {
        fileName = decodeURIComponent(match[1]);
      }
    }
    
    // Create and trigger download link
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }, 100);
  } catch (error) {
    console.error('Download error:', error);
    throw error;
  }
};

export const openResource = async (resourceId: string): Promise<void> => {
  const resource = await getResource(resourceId);
  window.open(resource.fileName, '_blank');
};

export const searchResources = async (query: string = ''): Promise<SearchResponse> => {
  const response: SearchResponse = await apiClient.get('/resources/search', {
    params: { query }
  });
  return response;
};

export const resourcesService = {
  getResource,
  downloadResource,
  openResource,
  searchResources,
};

export default resourcesService;