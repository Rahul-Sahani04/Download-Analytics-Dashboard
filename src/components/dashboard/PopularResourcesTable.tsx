import {
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Download,
  ExternalLink,
  FileText,
  Film,
  Image,
  Music,
  Presentation,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface PopularResourcesTableProps {
  isLoading: boolean;
  data?: Array<{
    id: string;
    title: string;
    type: 'document' | 'video' | 'image' | 'audio' | 'presentation';
    downloads: number;
    author: string;
    publishDate: string;
    trend: 'up' | 'down' | 'stable';
    trendPercent: number;
  }>;
}

export function PopularResourcesTable({ isLoading, data }: PopularResourcesTableProps) {
  const [sortField, setSortField] = useState<string>('downloads');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const sortedData = () => {
    if (!data) return [];
    
    return [...data].sort((a, b) => {
      const aValue = a[sortField as keyof typeof a];
      const bValue = b[sortField as keyof typeof b];
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }
      
      return 0;
    });
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'document':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'video':
        return <Film className="h-4 w-4 text-red-500" />;
      case 'image':
        return <Image className="h-4 w-4 text-green-500" />;
      case 'audio':
        return <Music className="h-4 w-4 text-purple-500" />;
      case 'presentation':
        return <Presentation className="h-4 w-4 text-amber-500" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader className="py-4">
        <CardTitle className="text-base font-medium">Popular Resources</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">
                    <Button variant="ghost" size="sm" onClick={() => handleSort('title')} className="-ml-3">
                      Title
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>
                    <Button variant="ghost" size="sm" onClick={() => handleSort('downloads')} className="-ml-3">
                      Downloads
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>
                    <Button variant="ghost" size="sm" onClick={() => handleSort('publishDate')} className="-ml-3">
                      Published
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Trend</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData().map((resource) => (
                  <TableRow key={resource.id}>
                    <TableCell className="font-medium">{resource.title}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {getTypeIcon(resource.type)}
                        <span className="capitalize">
                          {resource.type}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{resource.downloads.toLocaleString()}</TableCell>
                    <TableCell>{resource.author}</TableCell>
                    <TableCell>{resource.publishDate}</TableCell>
                    <TableCell>
                      <Badge variant={
                        resource.trend === 'up' ? 'success' :
                        resource.trend === 'down' ? 'destructive' : 'secondary'
                      } className="gap-1">
                        {resource.trend === 'up' ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : resource.trend === 'down' ? (
                          <ChevronDown className="h-3 w-3" />
                        ) : null}
                        {resource.trendPercent}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}