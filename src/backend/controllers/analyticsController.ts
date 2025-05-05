import { Request, Response } from 'express';
import { db } from '../db/database';

type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';
type TimeLabels = Record<TimeOfDay, string>;

export const getStats = async (req: Request, res: Response) => {
  try {
    const { dateRange, contentType, userRole } = req.query;
    
    // // Log the request for monitoring
    // console.log('Analytics request:', {
    //   userId: (req as any).user?.userId,
    //   filters: { dateRange, contentType, userRole }
    // });

    // Get overview stats
    const overviewResult = await db.query(`
      SELECT 
        COUNT(DISTINCT d.id) as total_downloads,
        COUNT(DISTINCT r.id) as total_resources,
        COUNT(DISTINCT d.user_id) as active_users,
        ROUND(CAST(COUNT(DISTINCT d.id) AS DECIMAL) / COUNT(DISTINCT d.user_id), 2) as average_engagement
      FROM downloads d
      LEFT JOIN resources r ON d.resource_id = r.id
      WHERE d.download_date >= NOW() - INTERVAL '30 days'
    `);

    // Get Total Resources
    const totalResourcesResult = await db.query(`
      SELECT COUNT(*) as total_resources
      FROM resources
    `);
    const totalResources = totalResourcesResult.rows[0].total_resources;

    // Get change percentages
    const previousPeriodResult = await db.query(`
      SELECT 
        COUNT(DISTINCT d.id) as prev_downloads,
        COUNT(DISTINCT d.user_id) as prev_users,
        COUNT(DISTINCT r.id) as prev_resources
      FROM downloads d
      LEFT JOIN resources r ON d.resource_id = r.id
      WHERE d.download_date >= NOW() - INTERVAL '60 days'
        AND d.download_date < NOW() - INTERVAL '30 days'
    `);

    // Calculate percentage changes
    const current = overviewResult.rows[0];
    const previous = previousPeriodResult.rows[0];
    const overview = {
      totalDownloads: parseInt(current.total_downloads),
      totalResources: parseInt(totalResources),
      activeUsers: parseInt(current.active_users),
      averageEngagement: parseFloat(current.average_engagement),
      downloadChange: calculatePercentageChange(current.total_downloads, previous.prev_downloads),
      usersChange: calculatePercentageChange(current.active_users, previous.prev_users),
      resourcesChange: calculatePercentageChange(current.total_resources, previous.prev_resources),
      engagementChange: 0 // Requires more complex calculation
    };

    // Get timeseries data
    const timeseriesResult = await db.query(`
      SELECT 
        DATE(download_date) as date,
        COUNT(*) as downloads
      FROM downloads
      WHERE download_date >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(download_date)
      ORDER BY date ASC
    `);

    // Get department data
    const departmentResult = await db.query(`
      SELECT 
        u.department,
        COUNT(d.id) as downloads
      FROM downloads d
      JOIN users u ON d.user_id = u.id
      WHERE d.download_date >= NOW() - INTERVAL '30 days'
      GROUP BY u.department
      ORDER BY downloads DESC
    `);

    // Get hourly distribution
    const hourlyResult = await db.query(`
      SELECT 
        CASE 
          WHEN EXTRACT(HOUR FROM download_date) BETWEEN 9 AND 12 THEN 'morning'
          WHEN EXTRACT(HOUR FROM download_date) BETWEEN 13 AND 16 THEN 'afternoon'
          WHEN EXTRACT(HOUR FROM download_date) BETWEEN 17 AND 20 THEN 'evening'
          ELSE 'night'
        END as time_of_day,
        COUNT(*) as downloads
      FROM downloads
      WHERE download_date >= NOW() - INTERVAL '30 days'
      GROUP BY time_of_day
    `);

    // Get user engagement
    const userEngagementResult = await db.query(`
      SELECT 
        u.role as name,
        COUNT(d.id) as downloads,
        ROUND(CAST(COUNT(d.id) AS DECIMAL) / COUNT(DISTINCT d.user_id), 2) as engagement
      FROM downloads d
      JOIN users u ON d.user_id = u.id
      WHERE d.download_date >= NOW() - INTERVAL '30 days'
      GROUP BY u.role
      ORDER BY downloads DESC
    `);

    // Get popular resources
    const popularResourcesResult = await db.query(`
      SELECT 
        r.id,
        r.title,
        r.mime_type as type,
        r.download_count as downloads,
        u.name as author,
        r.created_at as publish_date,
        CASE 
          WHEN r.download_count > LAG(r.download_count) OVER (ORDER BY r.download_count DESC) THEN 'up'
          WHEN r.download_count < LAG(r.download_count) OVER (ORDER BY r.download_count DESC) THEN 'down'
          ELSE 'stable'
        END as trend,
        ROUND(((r.download_count - LAG(r.download_count) OVER (ORDER BY r.download_count DESC)) / 
          NULLIF(LAG(r.download_count) OVER (ORDER BY r.download_count DESC), 0) * 100)::numeric, 1) as trend_percent
      FROM resources r
      JOIN users u ON r.uploaded_by = u.id
      ORDER BY r.download_count DESC
      LIMIT 5
    `);

    const stats = {
      overview,
      timeseries: timeseriesResult.rows.map(row => ({
        date: row.date.toISOString(),
        downloads: parseInt(row.downloads)
      })),
      departmentData: departmentResult.rows.map(row => ({
        department: row.department,
        downloads: parseInt(row.downloads)
      })),
      hourlyDownloads: hourlyResult.rows.map(row => ({
        name: row.time_of_day as TimeOfDay,
        value: parseInt(row.downloads),
        time: getTimeLabel(row.time_of_day as TimeOfDay)
      })),
      userEngagement: userEngagementResult.rows.map(row => ({
        name: row.name,
        downloads: parseInt(row.downloads),
        engagement: parseFloat(row.engagement)
      })),
      popularResources: popularResourcesResult.rows.map(row => ({
        id: row.id,
        title: row.title,
        type: row.type,
        downloads: parseInt(row.downloads),
        author: row.author,
        publishDate: formatDate(row.publish_date),
        trend: row.trend,
        trendPercent: parseFloat(row.trend_percent) || 0
      }))
    };

    res.json(stats);
  } catch (error) {
    console.error('Error getting analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
};

function calculatePercentageChange(current: number, previous: number): number {
  if (!previous) return 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function getTimeLabel(timeOfDay: TimeOfDay): string {
  const labels: TimeLabels = {
    morning: 'Morning (9am-1pm)',
    afternoon: 'Afternoon (1pm-5pm)',
    evening: 'Evening (5pm-9pm)',
    night: 'Night (9pm-9am)'
  };
  return labels[timeOfDay];
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export const exportData = async (req: Request, res: Response) => {
  try {
    const { format, filters } = req.body;
    
    // Log export request
    console.log('Export request:', {
      userId: (req as any).user?.userId,
      format,
      filters
    });

    // TODO: Implement real export functionality
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    res.json({
      url: `https://example.com/export/analytics_${Date.now()}.${format}`
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
};