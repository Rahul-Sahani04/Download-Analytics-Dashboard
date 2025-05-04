import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { FileUploadDownload } from '@/components/files/FileUploadDownload';

export default function Files() {
  return (
    <DashboardLayout>
      <div className="space-y-6 p-6 pb-16">
        <div className="space-y-0.5">
          <h2 className="text-2xl font-bold tracking-tight">File Management</h2>
          <p className="text-muted-foreground">
            Upload, download and manage files
          </p>
        </div>
        
        <FileUploadDownload />
      </div>
    </DashboardLayout>
  );
}