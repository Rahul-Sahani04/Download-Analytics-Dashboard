export interface FilterOptions {
  dateRange: {
    from: Date;
    to: Date | undefined;
  };
  contentType: string;
  userRole: string;
}

export interface Document {
  id: number;
  title: string;
  description?: string;
  filePath?: string;
  fileUrl?: string;
  downloads: number;
  fileSize?: number;
  mimeType?: string;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Resource {
  id: string;
  title: string;
  type: 'document' | 'video' | 'image' | 'audio' | 'presentation';
  downloads: number;
  author: string;
  publishDate: string;
  trend: 'up' | 'down' | 'stable';
  trendPercent: number;
  document?: Document;  // Reference to the associated document if type is 'document'
}

export interface DownloadStats {
  overview: {
    totalDownloads: number;
    totalResources: number;
    activeUsers: number;
    averageEngagement: number;
    downloadChange: number;
    usersChange: number;
    resourcesChange: number;
    engagementChange: number;
  };
  timeseries: Array<{
    date: string;
    downloads: number;
  }>;
  geoData: Array<{
    region: string;
    downloads: number;
  }>;
  hourlyDownloads: Array<{
    name: string;
    value: number;
    time: string;
  }>;
  userEngagement: Array<{
    name: string;
    downloads: number;
    engagement: number;
  }>;
  popularResources: Resource[];
}