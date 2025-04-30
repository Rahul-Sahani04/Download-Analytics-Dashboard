import { Request, Response } from 'express';

// In a real app, this would fetch from a database
const generateTimeseriesData = () => {
  const data = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    
    let downloads = 200 + Math.floor(Math.random() * 100);
    const day = date.getDay();
    if (day === 0 || day === 6) {
      downloads = Math.floor(downloads * 0.6);
    }
    downloads = Math.floor(downloads * (1 + (30 - i) * 0.01));
    
    data.push({
      date: date.toISOString(),
      downloads,
    });
  }
  return data;
};

export const getStats = async (req: Request, res: Response) => {
  try {
    // Get filter parameters
    const { dateRange, contentType, userRole } = req.query;
    
    // Log the request for monitoring
    console.log('Analytics request:', {
      userId: (req as any).user?.userId,
      filters: { dateRange, contentType, userRole }
    });

    // In a real app, these would be dynamic based on filters
    const stats = {
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
      ],
    };

    res.json(stats);
  } catch (error) {
    console.error('Error getting analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
};

export const exportData = async (req: Request, res: Response) => {
  try {
    const { format, filters } = req.body;
    
    // Log export request
    console.log('Export request:', {
      userId: (req as any).user?.userId,
      format,
      filters
    });

    // In a real app, this would generate a file and return a real URL
    // For now, simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Return mock URL
    res.json({
      url: `https://example.com/export/analytics_${Date.now()}.${format}`
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
};