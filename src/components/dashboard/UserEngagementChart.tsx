import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface UserEngagementChartProps {
  isLoading: boolean;
  data?: Array<{
    name: string;
    downloads: number;
    engagement: number;
  }>;
}

export function UserEngagementChart({ isLoading, data }: UserEngagementChartProps) {
  const chartData = useMemo(() => {
    if (!data) return [];
    return data;
  }, [data]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">User Engagement vs Downloads</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="w-full aspect-[3/2]">
            <Skeleton className="w-full h-full" />
          </div>
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  className="text-muted-foreground"
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  className="text-muted-foreground"
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  className="text-muted-foreground"
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="grid grid-cols-3 gap-2">
                            <div className="flex flex-col">
                              <span className="text-[0.70rem] uppercase text-muted-foreground">
                                Role
                              </span>
                              <span className="font-bold">
                                {payload[0].payload.name}
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[0.70rem] uppercase text-muted-foreground">
                                Downloads
                              </span>
                              <span className="font-bold">
                                {payload[0].value}
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[0.70rem] uppercase text-muted-foreground">
                                Engagement
                              </span>
                              <span className="font-bold">
                                {payload[1].value} min
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  yAxisId="left"
                  dataKey="downloads"
                  // fill="hsl(var(--chart-2))"
                  style={{
                    fill: 'var(--chart-4)',
                    opacity: 0.6,
                  }}
                  radius={[4, 4, 0, 0]}
                  barSize={30}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="engagement"
                  // stroke="hsl(var(--chart-1))"
                  // style={{
                  //   stroke: 'hsl(var(--chart-1))',
                  //   opacity: 0.8,
                  // }}
                  strokeWidth={2}
                  dot={{ r: 4, strokeWidth: 2 }}
                />
                <Legend
                  formatter={(value) => {
                    return (
                      <span className="text-xs">{value}</span>
                    );
                  }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}