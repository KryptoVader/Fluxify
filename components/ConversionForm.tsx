// ConversionForm.tsx
"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "./FileDropzone";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  X,
  ArrowRight,
  FileIcon,
  CircleHelp,
  FileType,
  Settings2,
} from "lucide-react";
import DownloadCard from "./DownloadCard";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

// allow all major mime types
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.ms-excel.sheet.binary.macroEnabled.12',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.oasis.opendocument.spreadsheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/epub+zip',
  'application/x-mobipocket-ebook',
  'application/rtf',
  'text/plain',
  'text/html',
  'application/xml',
  'application/xhtml+xml',
  'text/csv',
  'application/json',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/svg+xml',
  'image/tiff',
  'image/webp',
  'audio/mpeg',
  'audio/wav',
  'audio/flac',
  'audio/aac',
  'audio/ogg',
  'video/mp4',
  'video/x-msvideo',
  'video/quicktime',
  'video/x-ms-wmv',
  'video/x-flv',
  'video/webm',
  'video/x-matroska',
  'video/3gpp',
];

type FormatsMap = Record<string, string[]>;
// extensions that support HQ flag
const ffmpegFormats = [
  "mp4","avi","mov","mkv","webm","flv","wmv","3gp",
  "mp3","wav","aac","ogg","flac","m4a",
];

export default function ConversionForm() {
  const [formatsMap, setFormatsMap] = useState<FormatsMap>({});
  const [inputFormat, setInputFormat] = useState("");
  const [outputFormat, setOutputFormat] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [highQuality, setHighQuality] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [convertedFileName, setConvertedFileName] = useState("");
  const [fileSize, setFileSize] = useState<string | undefined>(undefined);

  const isFfmpegFile = file && ffmpegFormats.includes(inputFormat.toLowerCase());

  useEffect(() => {
    fetch("/api/supported-formats")
      .then((res) => res.json())
      .then((data: FormatsMap) => {
        setFormatsMap(data);
        const first = Object.keys(data)[0] || "";
        setInputFormat(first);
        setOutputFormat(data[first]?.[0] || "");
      })
      .catch(() => toast.error("Failed to load formats."))
      .finally(() => setTimeout(() => setIsInitializing(false), 300));
  }, []);

  const handleFileAccepted = (f: File) => {
    setFile(f);
    setHighQuality(false);
    const ext = f.name.split('.').pop()?.toLowerCase() || '';
    toast.success(`Uploaded ${f.name}`, {
      description: `${(f.size/1024/1024).toFixed(2)} MB`,
      action: { label: 'Remove', onClick: () => setFile(null) }
    });
    if (formatsMap[ext]) {
      setInputFormat(ext);
      setOutputFormat(formatsMap[ext][0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !outputFormat) {
      toast.error("Please upload a file and select an output format.");
      return;
    }
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("outputFormat", outputFormat);
      if (isFfmpegFile && highQuality) formData.append("highQuality", "true");

      const res = await fetch("/api/convert", { 
        method: "POST", 
        body: formData 
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Server error during conversion.");
      }
      
      const data = await res.json();
      const url = data.converted?.[0]?.url;
      
      if (!url) throw new Error("Conversion failed");
      
      setResultUrl(url);
      const base = file.name.replace(/\.[^.]+$/,'');
      setConvertedFileName(`${base}.${outputFormat}`);
      
      // Estimate file size if not provided in response
      const estimatedSize = ((file.size / 1024 / 1024) * 0.9).toFixed(2);
      setFileSize(`~${estimatedSize} MB`);
      
      toast.success("Conversion successful!");
    } catch(err: any) {
      console.error("Conversion error:", err);
      toast.error(err.message || "Server error during conversion.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitializing) return (
    <div className="flex flex-col items-center justify-center h-64">
      <Settings2 className="animate-spin w-12 h-12 text-primary" />
      <h3 className="mt-4">Loading Converter...</h3>
    </div>
  );

  if (resultUrl) return (
    <DownloadCard
      filename={convertedFileName}
      downloadUrl={resultUrl}
      fileExtension={outputFormat}
      fileSize={fileSize}
      onConvertAnother={() => {
        setFile(null);
        setOutputFormat(formatsMap[inputFormat]?.[0] || "");
        setResultUrl(null);
        setConvertedFileName("");
        setFileSize(undefined);
      }}
    />
  );

  return (
    <div className="max-w-2xl mx-auto py-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-3">
              <FileType className="w-6 h-6 text-primary" />
              <CardTitle className="text-xl">File Converter</CardTitle>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon">
                    <CircleHelp />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  Upload your file, choose formats, and convert.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <FileDropzone
              onFileAccepted={handleFileAccepted}
              acceptedFileTypes={ALLOWED_MIME_TYPES.reduce((acc, m) => { acc[m]=[]; return acc; }, {} as Record<string, string[]>)}
            />

            {file && (
              <motion.div
                initial={{ opacity:0, y:10 }}
                animate={{ opacity:1, y:0 }}
                className="flex justify-between p-3 bg-muted rounded"
              >
                <div className="flex items-center space-x-3">
                  <FileIcon />
                  <div>
                    <div className="truncate max-w-xs">{file.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {(file.size/1024/1024).toFixed(2)} MB
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setFile(null)}>
                  <X />
                </Button>
              </motion.div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Input Format</Label>
                <Badge variant="outline">{inputFormat.toUpperCase()}</Badge>
              </div>
              <div>
                <Label>Output Format</Label>
                <Select value={outputFormat} onValueChange={setOutputFormat}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose format" />
                  </SelectTrigger>
                  <SelectContent>
                    {(formatsMap[inputFormat]||[]).map(fmt => (
                      <SelectItem key={fmt} value={fmt}>{fmt.toUpperCase()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isFfmpegFile && (
              <div className="flex items-center space-x-2">
                <input id="hq-toggle" type="checkbox" checked={highQuality} onChange={e=>setHighQuality(e.target.checked)} className="h-4 w-4 text-primary border-gray-300 rounded" />
                <label htmlFor="hq-toggle" className="text-sm">High Quality (slower, better)</label>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={!file||isLoading}>
              {isLoading ? <><ArrowRight className="animate-pulse mr-2"/>Converting…</> : 'Convert Now'}
            </Button>
          </form>

          <AnimatePresence>
            {isLoading && (
              <motion.div
                key="loader"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center p-8 bg-gradient-to-br from-muted/80 to-muted rounded-xl shadow-lg space-y-6 mt-8"
              >
                {/* Animation with revolving file types that come in and out */}
                <div className="relative w-40 h-40">
                  {/* Central rotating hexagon with file icon */}
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
                  >
                    <div className="w-20 h-20 bg-primary/10 rounded-xl flex items-center justify-center transform rotate-45">
                      <div className="transform -rotate-45">
                        <FileType className="w-8 h-8 text-primary" />
                      </div>
                    </div>
                  </motion.div>

                  {/* Animated rings */}
                  <motion.div
                    className="absolute inset-0 border-2 border-primary/20 rounded-full"
                    animate={{ scale: [1, 1.1, 1], opacity: [0.7, 0.2, 0.7] }}
                    transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                  />

                  <motion.div
                    className="absolute inset-0 border border-primary/30 rounded-full"
                    animate={{ scale: [1.1, 1.2, 1.1], opacity: [0.5, 0.1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut', delay: 0.5 }}
                  />

                  {/* Popular File Types with revolving motion and inward/outward movement */}
                  {['PDF', 'MP4', 'JPG', 'DOC', 'MP3', 'PNG'].map((fileType, i) => {
                    // Calculate starting angle spread evenly around the circle
                    const startAngle = (i * 60) % 360; // 60 degrees per file type (360/6 = 60)

                    return (
                      <motion.div
                        key={`file-${i}`}
                        className="absolute top-1/2 left-1/2"
                        style={{
                          translateX: '-50%',
                          translateY: '-50%',
                          rotate: `${startAngle}deg` // Start at different angles
                        }}
                        animate={{
                          rotate: [`${startAngle}deg`, `${startAngle + 360}deg`], // Revolution around center starting from different angles
                        }}
                        transition={{
                          rotate: {
                            repeat: Infinity,
                            duration: 20, // Slower revolution
                            ease: 'linear'
                          }
                        }}
                      >
                        <motion.div
                          style={{
                            translateX: '-50%',
                            translateY: '-50%'
                          }}
                          animate={{
                            x: [80, 40, 80], // Wider movement range (further from center)
                            scale: [0.9, 1.2, 0.9],
                            opacity: [0.7, 1, 0.7]
                          }}
                          transition={{
                            x: {
                              repeat: Infinity,
                              duration: 6,
                              ease: "easeInOut",
                              delay: i * 0.8 // Increased delay between animations
                            },
                            scale: {
                              repeat: Infinity,
                              duration: 6,
                              ease: 'easeInOut',
                              delay: i * 0.8
                            },
                            opacity: {
                              repeat: Infinity,
                              duration: 6,
                              ease: 'easeInOut',
                              delay: i * 0.8
                            }
                          }}
                          className="absolute bg-primary/10 backdrop-blur-sm px-2 py-1 rounded-md border border-primary/20"
                        >
                          <span className="text-xs font-mono font-bold text-primary">{fileType}</span>
                        </motion.div>
                      </motion.div>
                    );
                  })}

                  {/* Data stream particles */}
                  <div className="absolute inset-0">
                    {[...Array(8)].map((_, i) => (
                      <motion.div
                        key={`particle-${i}`}
                        className="absolute w-1 h-1 bg-primary rounded-full"
                        initial={{
                          x: '50%',
                          y: '50%',
                          opacity: 0,
                          scale: 0
                        }}
                        animate={{
                          x: ['50%', `${45 + Math.random() * 10}%`],
                          y: ['50%', `${45 + Math.random() * 10}%`],
                          opacity: [0, 0.8, 0],
                          scale: [0, 1, 0]
                        }}
                        transition={{
                          duration: 1.5 + Math.random(),
                          repeat: Infinity,
                          delay: i * 0.4,
                          ease: 'easeInOut'
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className="text-center">
                  <h4 className="text-lg font-medium">
                    <motion.span
                      animate={{ opacity: [1, 0.7, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      {isFfmpegFile && highQuality ? "High Quality Conversion" : "Converting your file"}
                    </motion.span>
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Processing {file?.name.split('.').pop()?.toUpperCase()} to {outputFormat.toUpperCase()}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}