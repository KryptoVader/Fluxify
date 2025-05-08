"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle, 
  Download, 
  ArrowRight, 
  Share2, 
  Copy, 
  ChevronDown,
  ChevronUp,
  FileText,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface DownloadCardProps {
  url: string;
  fileName: string;
  onReset: () => void;
  fileSize?: string;
  fileType?: string;
  previewAvailable?: boolean;
}

export function DownloadCard({ 
  url, 
  fileName, 
  onReset, 
  fileSize, 
  fileType,
  previewAvailable = false
}: DownloadCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [downloadStarted, setDownloadStarted] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin + url);
      toast.success("Link copied to clipboard!", {
        description: "Share it with anyone who needs this file",
      });
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Converted File: ${fileName}`,
          text: `Check out this converted file: ${fileName}`,
          url: window.location.origin + url,
        });
        toast.success("Shared successfully!");
      } catch (error: any) {
        if (error.name !== "AbortError") {
          toast.error("Failed to share");
        }
      }
    } else {
      handleCopy();
    }
  };

  const handleDownload = () => {
    setDownloadStarted(true);
    toast.success("Download started!", {
      description: `Downloading ${fileName}`,
    });
    
    // Reset the download state after animation completes
    setTimeout(() => setDownloadStarted(false), 3000);
  };

  // Extract file extension from fileName
  const fileExtension = fileName.split('.').pop()?.toUpperCase() || fileType;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-900/10 border border-primary-200 dark:border-primary-800 shadow-lg rounded-xl p-6 flex flex-col items-center space-y-5 max-w-md w-full mx-auto"
    >
      <motion.div 
        className="bg-primary-100 dark:bg-primary-900/30 p-4 rounded-full"
        animate={downloadStarted ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        <CheckCircle className="h-12 w-12 text-primary" />
      </motion.div>

      <div className="text-center space-y-2 w-full">
        <h3 className="text-2xl font-bold text-primary-800 dark:text-primary-100">Conversion Complete!</h3>
        <div className="flex items-center justify-center gap-2">
          <Badge variant="outline" className="bg-primary-50 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 border-primary-200 dark:border-primary-700">
            {fileExtension}
          </Badge>
          {fileSize && (
            <Badge variant="outline" className="bg-primary-50 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 border-primary-200 dark:border-primary-700">
              {fileSize}
            </Badge>
          )}
        </div>
        <p className="text-sm text-primary-700 dark:text-primary-300 max-w-xs mx-auto truncate">
          {fileName}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.a
                href={url}
                download={fileName}
                onClick={handleDownload}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="w-full"
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

        <div className="flex gap-2 w-full">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex-1"
                >
                  <Button
                    variant="outline"
                    onClick={handleCopy}
                    className="w-full border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/40"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy download link</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex-1"
                >
                  <Button
                    variant="outline"
                    onClick={handleShare}
                    className="w-full border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/40"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Share this file</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {previewAvailable && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex-1"
                  >
                    <Button
                      variant="outline"
                      className="w-full border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/40"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </motion.a>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Preview file</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      <div className="w-full">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDetails(!showDetails)}
          className="w-full text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/30 flex items-center justify-center"
        >
          <span>File Details</span>
          {showDetails ? 
            <ChevronUp className="ml-2 h-4 w-4" /> : 
            <ChevronDown className="ml-2 h-4 w-4" />
          }
        </Button>

        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="pt-3 pb-1 px-3 mt-2 border border-primary-200 dark:border-primary-800 rounded-lg bg-primary-50/50 dark:bg-primary-900/20">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-primary-500 dark:text-primary-400" />
                  <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                    File Information
                  </span>
                </div>
                <div className="text-sm text-primary-600 dark:text-primary-400 space-y-1 pl-6">
                  <p><span className="font-medium">Name:</span> {fileName}</p>
                  <p><span className="font-medium">Type:</span> {fileType || fileExtension}</p>
                  {fileSize && <p><span className="font-medium">Size:</span> {fileSize}</p>}
                  <p><span className="font-medium">Created:</span> {new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 w-full">
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-200 hover:bg-primary-100 dark:hover:bg-primary-900/30"
        >
          <ArrowRight className="mr-2 h-4 w-4" />
          Convert Another File
        </Button>

        <Link href="/" className="w-full sm:w-auto">
          <Button
            variant="link"
            size="sm"
            className="w-full text-primary-600 dark:text-primary-400"
          >
            Return to Home
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}