import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { resourcesService } from "@/services/resources-service";
import { FileIcon, DownloadIcon, SearchIcon } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

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
}

export default function Resources() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [search, setSearch] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async (query = '') => {
    try {
      const response = await resourcesService.searchResources(query);
      setResources(response.results);
      console.log('Resources fetched:', response.results);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch resources",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async (resourceId: number) => {
    try {
      await resourcesService.downloadResource(resourceId.toString());
      toast({
        title: "Success",
        description: "Download started",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download resource",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number | null | undefined) => {
    if (!bytes || isNaN(bytes)) {
      return "0 B"; // Default value for invalid or missing file size
    }
  
    const units = ['B', 'KB', 'MB', 'GB'];
    
    let size = bytes;
    // Convert to number if it's a string
    if (typeof size === 'string') {
      size = parseFloat(size);
    }
    let unitIndex = 0;
  
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
  
    return `${size.toFixed(1)}  ${units[unitIndex]}`;
  };

  return (
    <DashboardLayout>
    <div className="container mx-auto py-6">
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">Resources</h2>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search resources..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchResources(search)}
              />
            </div>
            <Button onClick={() => fetchResources(search)}>
              Search
            </Button>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Downloads</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resources.map((resource) => (
                <TableRow key={resource.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <FileIcon className="h-4 w-4" />
                      {resource.title}
                    </div>
                  </TableCell>
                  <TableCell>{resource.type}</TableCell>
                  <TableCell>{formatFileSize(resource.fileSize)}</TableCell>
                  <TableCell>{resource.author || 'Unknown'}</TableCell>
                  <TableCell>{resource.downloadCount}</TableCell>
                  <TableCell>
                    {new Date(resource.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDownload(resource.id)}
                    >
                      <DownloadIcon className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  </DashboardLayout>
  );
}