import { Activity, ArrowDown, ArrowUp, Download, FileText, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface OverviewStatsProps {
  isLoading: boolean;
  stats?: {
    totalDownloads: number;
    totalResources: number;
    activeUsers: number;
    averageEngagement: number;
    downloadChange: number;
    usersChange: number;
    resourcesChange: number;
    engagementChange: number;
  };
}

export function OverviewStats({ isLoading, stats }: OverviewStatsProps) {
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      notation: num > 9999 ? 'compact' : 'standard',
      maximumFractionDigits: 1,
    }).format(num);
  };

  const items = [
    {
      title: 'Total Downloads',
      icon: Download,
      value: stats?.totalDownloads,
      change: stats?.downloadChange,
      formattedValue: formatNumber(stats?.totalDownloads || 0),
      iconClass: 'text-blue-500',
      changePrefix: stats?.downloadChange >= 0 ? '+' : '',
    },
    {
      title: 'Active Users',
      icon: Users,
      value: stats?.activeUsers,
      change: stats?.usersChange,
      formattedValue: formatNumber(stats?.activeUsers || 0),
      iconClass: 'text-teal-500',
      changePrefix: stats?.usersChange >= 0 ? '+' : '',
    },
    {
      title: 'Available Resources',
      icon: FileText,
      value: stats?.totalResources,
      change: stats?.resourcesChange,
      formattedValue: formatNumber(stats?.totalResources || 0),
      iconClass: 'text-amber-500',
      changePrefix: stats?.resourcesChange >= 0 ? '+' : '',
    },
    {
      title: 'Avg. Engagement',
      icon: Activity,
      value: stats?.averageEngagement,
      change: stats?.engagementChange,
      formattedValue: `${stats?.averageEngagement?.toFixed(1) || 0}m`,
      iconClass: 'text-indigo-500',
      changePrefix: stats?.engagementChange >= 0 ? '+' : '',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <Card key={item.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
            <div className={`${item.iconClass} rounded-full p-1 bg-muted`}>
              <item.icon className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <>
                <Skeleton className="h-8 w-24 mb-1" />
                <Skeleton className="h-4 w-16" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">{item.formattedValue}</div>
                <p className="text-xs flex items-center text-muted-foreground">
                  {typeof item.change === 'number' && (
                    <>
                      {item.change >= 0 ? (
                        <ArrowUp className="h-3 w-3 mr-1 text-green-500" />
                      ) : (
                        <ArrowDown className="h-3 w-3 mr-1 text-red-500" />
                      )}
                      <span className={item.change >= 0 ? 'text-green-500' : 'text-red-500'}>
                        {item.changePrefix}
                        {Math.abs(item.change).toFixed(1)}%
                      </span>
                    </>
                  )}
                  <span className="ml-1">from last period</span>
                </p>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}