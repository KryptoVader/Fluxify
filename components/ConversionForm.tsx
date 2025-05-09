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

  const isFfmpegFile =
    file && ffmpegFormats.includes(inputFormat.toLowerCase());

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
    const ext = f.name.split(".").pop()?.toLowerCase() || "";
    toast.success(`Uploaded ${f.name}`, {
      description: `${(f.size / 1024 / 1024).toFixed(2)} MB`,
      action: { label: "Remove", onClick: () => setFile(null) },
    });
    if (formatsMap[ext]) {
      setInputFormat(ext);
      setOutputFormat(formatsMap[ext][0]);
    } else {
      toast.error(`.${ext} not supported`);
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
      if (isFfmpegFile && highQuality) {
        formData.append("highQuality", "true");
      }
      const res = await fetch("/api/convert", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      const url = data.converted?.[0]?.url;
      if (!url) throw new Error("Conversion failed");
      setResultUrl(url);
      const base = file.name.replace(/\.[^.]+$/, "");
      setConvertedFileName(`${base}.${outputFormat}`);
      toast.success("Conversion successful!");
    } catch (err: any) {
      toast.error(err.message || "Server error during conversion.");
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
        filename={convertedFileName}
        downloadUrl={resultUrl}
        fileExtension={outputFormat}
        onConvertAnother={() => {
          setFile(null);
          setOutputFormat(Object.keys(formatsMap)[0] || "");
          setResultUrl(null);
          setConvertedFileName("");
        }}
      />
    );
  }

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
            <FileDropzone onFileAccepted={handleFileAccepted} acceptedFileTypes={{
              "image/*": [], "video/*": [], "audio/*": [],
              "application/pdf": [], "application/zip": [], "text/plain": []
            }} />

            {file && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-between p-3 bg-muted rounded"
              >
                <div className="flex items-center space-x-3">
                  <FileIcon />
                  <div>
                    <div className="truncate max-w-xs">{file.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setFile(null)}
                >
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
                <Select
                  value={outputFormat}
                  onValueChange={setOutputFormat}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose format" />
                  </SelectTrigger>
                  <SelectContent>
                    {(formatsMap[inputFormat] || []).map((fmt) => (
                      <SelectItem key={fmt} value={fmt}>
                        {fmt.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isFfmpegFile && (
              <div className="flex items-center space-x-2">
                <input
                  id="hq-toggle"
                  type="checkbox"
                  checked={highQuality}
                  onChange={(e) => setHighQuality(e.target.checked)}
                  className="h-4 w-4 text-primary border-gray-300 rounded"
                />
                <label htmlFor="hq-toggle" className="text-sm">
                  High Quality (slower, better)
                </label>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={!file || isLoading}
            >
              {isLoading ? (
                <>
                  <ArrowRight className="animate-pulse mr-2" />
                  Converting…
                </>
              ) : (
                "Convert Now"
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
                <div className="relative w-40 h-40">
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    animate={{ rotate: 360 }}
                    transition={{
                      repeat: Infinity,
                      duration: 8,
                      ease: "linear",
                    }}
                  >
                    <div className="w-20 h-20 bg-primary/10 rounded-xl flex items-center justify-center transform rotate-45">
                      <div className="transform -rotate-45">
                        <FileType className="w-8 h-8 text-primary" />
                      </div>
                    </div>
                  </motion.div>
                  <motion.div
                    className="absolute inset-0 border-2 border-primary/20 rounded-full"
                    animate={{
                      scale: [1, 1.1, 1],
                      opacity: [0.7, 0.2, 0.7],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 3,
                      ease: "easeInOut",
                    }}
                  />
                </div>
                <div className="text-center">
                  <h4 className="text-lg font-medium">
                    <motion.span
                      animate={{ opacity: [1, 0.7, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      {isFfmpegFile && highQuality
                        ? "High Quality Conversion"
                        : "Converting your file"}
                    </motion.span>
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Processing{" "}
                    {file?.name.split(".").pop()?.toUpperCase()} to{" "}
                    {outputFormat.toUpperCase()}
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
