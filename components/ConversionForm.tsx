"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  AlertCircle,
  Upload,
} from "lucide-react";
import { DownloadCard } from "./DownloadCard";
import {
  Card,
  CardContent,
  CardFooter,
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Simplified formats map
type FormatsMap = Record<string, string[]>;

// FFmpeg‐supported extensions
const ffmpegFormats = [
  'mp4', 'avi', 'mov', 'mkv', 'webm', 'flv', 'wmv', '3gp',
  'mp3', 'wav', 'aac', 'ogg', 'flac', 'm4a'
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
  const [convertedFileName, setConvertedFileName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Determine if current file uses FFmpeg plugin
  const isFfmpegFile = file
    ? ffmpegFormats.includes(inputFormat.toLowerCase())
    : false;

  // Load supported formats on mount
  useEffect(() => {
    const loadFormats = async () => {
      try {
        const res = await fetch("/api/supported-formats");
        if (!res.ok) {
          throw new Error(`Failed to load formats (${res.status})`);
        }
        const data: FormatsMap = await res.json();
        setFormatsMap(data);
        
        // Only set default formats if there's data
        if (Object.keys(data).length > 0) {
          const first = Object.keys(data)[0] || "";
          setInputFormat(first);
          setOutputFormat(data[first]?.[0] || "");
        }
        
        setTimeout(() => setIsInitializing(false), 300);
      } catch (err) {
        console.error("Error loading formats:", err);
        setIsInitializing(false);
        toast.error("Failed to load supported formats. Please refresh the page.");
      }
    };
    
    loadFormats();
  }, []);

  const handleFileAccepted = (f: File) => {
    console.log("File accepted:", f.name); // Debug log
    setFile(f);
    setHighQuality(false); // reset HQ when new file loaded
    setError(null); // Clear any previous errors
    
    const ext = f.name.split('.').pop()?.toLowerCase() || '';
    toast.success(`Uploaded ${f.name}`, {
      description: `${(f.size / 1024 / 1024).toFixed(2)} MB`,
      action: { label: 'Remove', onClick: () => setFile(null) }
    });
    
    // Only set formats if this extension is recognized
    if (formatsMap[ext]) {
      setInputFormat(ext);
      setOutputFormat(formatsMap[ext][0]);
    } else {
      // Handle unrecognized file format
      toast.error("Unsupported file format", {
        description: `The format ${ext.toUpperCase()} is not supported for conversion.`
      });
      setError(`File format .${ext} is not supported. Please try a different file.`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Clear any previous errors
    
    if (!file) {
      setError("Please upload a file first.");
      toast.error("Please upload a file first.");
      return;
    }
    
    if (!outputFormat) {
      setError("Please select an output format.");
      toast.error("Please select an output format.");
      return;
    }
    
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('outputFormat', outputFormat);

      // only append HQ flag for FFmpeg files
      if (isFfmpegFile && highQuality) {
        formData.append('highQuality', 'true');
      }

      const response = await fetch('/api/convert', { method: 'POST', body: formData });
      
      if (!response.ok) {
        // Handle different types of HTTP errors
        if (response.status === 500) {
          throw new Error("Server error occurred. Please try again later.");
        } else if (response.status === 413) {
          throw new Error("File too large for conversion.");
        } else if (response.status === 415) {
          throw new Error("Unsupported file format.");
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Error (${response.status}): File conversion failed.`);
        }
      }
      
      const data = await response.json();
      const url = data.converted?.[0]?.url;
      if (!url) throw new Error('Conversion failed. No output file was created.');
      setResultUrl(url);
      const base = file.name.replace(/\.[^.]+$/, '');
      setConvertedFileName(`${base}.${outputFormat}`);
      toast.success('Conversion successful!');
    } catch (err: any) {
      const errorMessage = err.message || 'File conversion failed. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Settings2 className="animate-spin w-12 h-12 text-primary" />
        <h3 className="mt-4">Loading Converter...</h3>
      </div>
    );
  }

  if (resultUrl) {
    return (
      <DownloadCard
        url={resultUrl}
        fileName={convertedFileName}
        onReset={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-6">
      <Card>
        {/* Aligned header: icon and title vertically centered, tooltip on right */}
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
                  <p>Upload your file, choose formats, and convert.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <FileDropzone 
              onFileAccepted={handleFileAccepted} 
              acceptedFileTypes={{
                "image/*": [],
                "video/*": [],
                "audio/*": [],
                "application/pdf": [],
                "application/msword": [],
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [],
                "text/plain": [],
                "application/zip": [],
                // Add other accepted MIME types as needed
              }}
            />

            {file && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between p-3 bg-muted rounded">
                <div className="flex items-center space-x-3">
                  <FileIcon />
                  <div>
                    <div className="truncate max-w-xs">{file.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => {
                  setFile(null);
                  setError(null);
                }}>
                  <X />
                </Button>
              </motion.div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Input Format</Label>
                {inputFormat ? (
                  <Badge variant="outline">{inputFormat.toUpperCase()}</Badge>
                ) : (
                  <p className="text-sm text-muted-foreground">Upload a file to see its format</p>
                )}
              </div>
              <div>
                <Label>Output Format</Label>
                {file ? (
                  <Select 
                    value={outputFormat} 
                    onValueChange={(value) => {
                      setOutputFormat(value);
                      // Clear output format error if it exists
                      if (error === "Please select an output format.") {
                        setError(null);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose format" />
                    </SelectTrigger>
                    <SelectContent>
                      {inputFormat && formatsMap[inputFormat] ? (
                        formatsMap[inputFormat].map(fmt => (
                          <SelectItem key={fmt} value={fmt}>{fmt.toUpperCase()}</SelectItem>
                        ))
                      ) : (
                        <SelectItem value="" disabled>No formats available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Upload size={16} />
                    Upload a file first
                  </div>
                )}
              </div>
            </div>

            {/* High Quality toggle only for FFmpeg files */}
            {isFfmpegFile && (
              <div className="flex items-center space-x-2">
                <input
                  id="hq-toggle"
                  type="checkbox"
                  checked={highQuality}
                  onChange={e => setHighQuality(e.target.checked)}
                  className="h-4 w-4 text-primary border-gray-300 rounded"
                />
                <label htmlFor="hq-toggle" className="text-sm">
                  High Quality (slower, better)
                </label>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={!file || isLoading}>
              {isLoading ? (
                <>
                  <ArrowRight className="animate-pulse mr-2" />
                  Converting…
                </>
              ) : (
                'Convert Now'
              )}
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