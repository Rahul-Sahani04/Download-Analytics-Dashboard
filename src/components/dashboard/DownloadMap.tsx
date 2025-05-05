import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";

interface DownloadMapProps {
  isLoading: boolean;
  data?: Array<{
    department: string;
    downloads: number;
  }>;
  className?: string;
}

export function DownloadMap({ isLoading, data, className }: DownloadMapProps) {
  const sortedData = useMemo(() => {
    if (!data) return [];
    return [...data].sort((a, b) => b.downloads - a.downloads).slice(0, 10);
  }, [data]);

  const getBarFill = (index: number) => {
    const colors = [
      "hsl(var(--chart-1))",
      "hsl(var(--chart-2))",
      "hsl(var(--chart-3))",
      "hsl(var(--chart-4))",
      "hsl(var(--chart-5))",
    ];
    return colors[index % colors.length];
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">
          Downloads by Department
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="w-full aspect-[3/2]">
            <Skeleton className="w-full h-full" />
          </div>
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sortedData}
                layout="vertical"
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  horizontal
                  strokeDasharray="3 3"
                  className="stroke-muted"
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  className="text-muted-foreground"
                />
                <YAxis
                  type="category"
                  dataKey="department"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={120}
                  className="text-muted-foreground"
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col">
                              <span className="text-[0.70rem] uppercase text-muted-foreground">
                                Department
                              </span>
                              <span className="font-bold">
                                {payload[0].payload.department}
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
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="downloads" radius={[0, 4, 4, 0]}>
                  {sortedData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      style={{
                        fill: `var(--chart-${(index % 5) + 1})`,
                        opacity: 0.6,
                      }}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
