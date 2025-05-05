import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { OverviewStats } from '@/components/dashboard/OverviewStats';
import { DownloadsByTimeChart } from '@/components/dashboard/DownloadsByTimeChart';
import { PopularResourcesTable } from '@/components/dashboard/PopularResourcesTable';
import { UserEngagementChart } from '@/components/dashboard/UserEngagementChart';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { DownloadMap } from '@/components/dashboard/DownloadMap';
import { TimeseriesChart } from '@/components/dashboard/TimeseriesChart';
import { DownloadService } from '@/services/download-service';
import { FilterOptions } from '@/types';

const REFRESH_INTERVAL = 30000; // 30 seconds

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    dateRange: { from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), to: new Date() },
    contentType: 'all',
    userRole: 'all',
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await DownloadService.getStats(filters);
      setStats(data);
      console.log('Fetched stats:', data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Set up polling
    const intervalId = setInterval(fetchData, REFRESH_INTERVAL);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [filters]);

  const handleFilterChange = (newFilters: Partial<FilterOptions>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6 pb-16">
        <div className="space-y-0.5">
          <h2 className="text-2xl font-bold tracking-tight">Download Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Track and analyze content usage across the platform
          </p>
        </div>
        
        <FilterBar filters={filters} onFilterChange={handleFilterChange} />
        
        <OverviewStats isLoading={isLoading} stats={stats?.overview} />
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          <TimeseriesChart 
            isLoading={isLoading} 
            data={stats?.timeseries} 
            className="md:col-span-2 lg:col-span-4"
          />
          <DownloadMap 
            isLoading={isLoading} 
            data={stats?.departmentData} 
            className="md:col-span-2 lg:col-span-3"
          />
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          <DownloadsByTimeChart 
            isLoading={isLoading} 
            data={stats?.hourlyDownloads} 
          />
          <UserEngagementChart 
            isLoading={isLoading} 
            data={stats?.userEngagement} 
          />
        </div>
        
        <PopularResourcesTable 
          isLoading={isLoading} 
          data={stats?.popularResources} 
        />
      </div>
    </DashboardLayout>
  );
}