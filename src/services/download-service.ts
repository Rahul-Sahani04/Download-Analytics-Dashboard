import { DownloadStats, FilterOptions } from '@/types';
import { apiClient } from './api-client';

// Mock data generator
const generateMockData = (): DownloadStats => {
  // Helper function to generate timeseries data
  const generateTimeseriesData = () => {
    const data: Array<{ date: string; downloads: number }> = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      
      // Generate a somewhat realistic looking data pattern
      let downloads = 200 + Math.floor(Math.random() * 100);
      
      // Add weekly pattern (weekends have lower downloads)
      const day = date.getDay();
      if (day === 0 || day === 6) { // weekend
        downloads = Math.floor(downloads * 0.6);
      }
      
      // Add some trend
      downloads = Math.floor(downloads * (1 + (30 - i) * 0.01));
      
      data.push({
        date: date.toISOString(),
        downloads,
      });
    }
    return data;
  };

  return {
    overview: {
      totalDownloads: 8426,
      totalResources: 450,
      activeUsers: 2845,
      averageEngagement: 8.5,
      downloadChange: 5.2,
      usersChange: 3.4,
      resourcesChange: 2.7,
      engagementChange: 1.5,
    },
    timeseries: generateTimeseriesData(),
    geoData: [
      { region: 'Main Campus', downloads: 3245 },
      { region: 'Engineering Block', downloads: 2156 },
      { region: 'Science Block', downloads: 1532 },
      { region: 'Management Block', downloads: 892 },
      { region: 'Library', downloads: 601 },
    ],
    hourlyDownloads: [
      { name: 'morning', value: 45, time: 'Morning (9am-1pm)' },
      { name: 'afternoon', value: 35, time: 'Afternoon (1pm-5pm)' },
      { name: 'evening', value: 15, time: 'Evening (5pm-9pm)' },
      { name: 'night', value: 5, time: 'Night (9pm-9am)' },
    ],
    userEngagement: [
      { name: 'Students', downloads: 5200, engagement: 12 },
      { name: 'Faculty', downloads: 1800, engagement: 20 },
      { name: 'Staff', downloads: 850, engagement: 8 },
      { name: 'Research Scholars', downloads: 576, engagement: 15 },
    ],
    popularResources: [
      {
        id: '1',
        title: 'Introduction to Machine Learning',
        type: 'document',
        downloads: 842,
        author: 'Dr. Alan Smith',
        publishDate: 'Apr 15, 2025',
        trend: 'up',
        trendPercent: 12,
      },
      {
        id: '2',
        title: 'Advanced Calculus - Lecture Series',
        type: 'video',
        downloads: 756,
        author: 'Prof. Maria Johnson',
        publishDate: 'Mar 22, 2025',
        trend: 'up',
        trendPercent: 8,
      },
      {
        id: '3',
        title: 'Organic Chemistry Lab Manual',
        type: 'document',
        downloads: 534,
        author: 'Dr. Robert Williams',
        publishDate: 'Feb 10, 2025',
        trend: 'down',
        trendPercent: 3,
      },
      {
        id: '4',
        title: 'World History Timeline',
        type: 'presentation',
        downloads: 425,
        author: 'Prof. Catherine Lee',
        publishDate: 'Mar 5, 2025',
        trend: 'stable',
        trendPercent: 0,
      },
      {
        id: '5',
        title: 'Quantum Physics Fundamentals',
        type: 'video',
        downloads: 389,
        author: 'Dr. Richard Feynman',
        publishDate: 'Jan 12, 2025',
        trend: 'up',
        trendPercent: 15,
      },
    ],
  };
};

export const DownloadService = {
  getStats: async (filters: FilterOptions): Promise<DownloadStats> => {
    try {
      // Make a real API call with filters
      const response = await apiClient.get<DownloadStats>('/analytics/stats', filters);
      return response;
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Fallback to mock data in case of API error
      return generateMockData();
    }
  },

  exportData: async (format: 'csv' | 'pdf', filters: FilterOptions): Promise<string> => {
    try {
      const response = await apiClient.post<{ url: string }>('/analytics/export', {
        format,
        filters
      });
      return response.url;
    } catch (error) {
      console.error('Error exporting data:', error);
      throw new Error('Failed to export data');
    }
  },
};