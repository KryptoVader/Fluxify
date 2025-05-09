// app/components/DownloadCard.tsx
'use client';

import { motion } from 'framer-motion';
import { Download, Copy, Eye } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';

interface DownloadCardProps {
  url: string;
  fileName: string;
  onReset: () => void;
  fileSize?: number;          // in bytes
  fileType?: string;          // MIME type or extension
  previewAvailable?: boolean; // whether to show a “Preview” button
}

export function DownloadCard({
  url,
  fileName,
  onReset,
  fileSize,
  fileType,
  previewAvailable = false,
}: DownloadCardProps) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      // you could show a toast here
    } catch {
      console.error('Failed to copy URL');
    }
  };

  const handleDownload = () => {
    // Optional: any analytics or state reset you need
    onReset();
  };

  return (
    <div className="space-y-4 p-4 border rounded">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">{fileName}</p>
          {fileSize != null && (
            <p className="text-sm text-muted-foreground">
              {(fileSize / 1024).toFixed(2)} KB • {fileType}
            </p>
          )}
        </div>
        <Button variant="ghost" onClick={handleCopy}>
          <Copy className="h-4 w-4" />
        </Button>
      </div>

      {previewAvailable && (
        <Button asChild variant="outline">
          <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center"
        >
          <Eye className="mr-2 h-4 w-4" />
          Preview
          </a>
        </Button>
      )}

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.a
              href={`/api/download/${encodeURIComponent(fileName)}`}
              download={fileName}
              onClick={handleDownload}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="block w-full"
            >
              <Button
                variant="outline"
                className="w-full border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/40"
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </motion.a>
          </TooltipTrigger>
          <TooltipContent>
            <p>Save file to your device</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
