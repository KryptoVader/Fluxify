export interface ConversionJob {
  id: string;
  originalFileName: string;
  originalFormat: string;
  targetFormat: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  createdAt: Date;
  completedAt?: Date;
  downloadUrl?: string;
  errorMessage?: string;
  size: number; // in bytes
}

export interface SupportedFormat {
  extension: string;
  name: string;
  category: 'document' | 'image' | 'video' | 'audio' | 'archive' | 'other';
  icon: string; // icon name from lucide-react
  description: string;
  canConvertTo: string[]; // list of supported target formats
}