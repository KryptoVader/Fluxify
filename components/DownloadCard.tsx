// DownloadCard.tsx
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
import {
  Card,
  CardContent
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface DownloadCardProps {
  filename: string;
  downloadUrl: string;
  fileExtension: string;
  fileSize?: string;
  onConvertAnother: () => void;
}

export default function DownloadCard({ filename, downloadUrl, fileExtension, fileSize, onConvertAnother }: DownloadCardProps) {
  const [copied, setCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [downloadStarted, setDownloadStarted] = useState(false);
  const [metaOpen, setMetaOpen] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(downloadUrl);
      setCopied(true);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-6">
      <Card>
        <CardContent className="p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <motion.div 
              className="flex justify-center" 
              animate={downloadStarted ? { scale: [1, 1.1, 1] } : {}} 
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              <CheckCircle className="h-12 w-12 text-primary" />
            </motion.div>

            <div className="text-center space-y-2 w-full">
              <h3 className="text-2xl font-bold">Conversion Complete!</h3>
              <div className="flex items-center justify-center gap-2">
                <Badge variant="outline" className="bg-primary/10 border-primary/20">{fileExtension.toUpperCase()}</Badge>
                {fileSize && <Badge variant="outline" className="bg-primary/10 border-primary/20">{fileSize}</Badge>}
              </div>
              <p className="text-sm text-muted-foreground truncate">{filename}</p>
            </div>

            <div className="space-y-4">
              <Button 
                className="w-full" 
                size="lg" 
                asChild 
                onClick={() => { setDownloadStarted(true); setTimeout(() => setDownloadStarted(false), 500); }}
              >
                <a href={downloadUrl} download={filename} className="flex items-center justify-center w-full">
                  <Download className="mr-2 h-5 w-5" />Download
                </a>
              </Button>
              
              <div className="flex justify-between">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" onClick={handleCopy} className="flex-1 mr-2">
                        <Copy className="mr-1 h-4 w-4"/>{copied ? "Copied" : "Copy Link"}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Copy download link</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <div className="relative">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShareOpen(o => !o)} 
                    className="flex items-center"
                  >
                    <Share2 className="mr-1 h-4 w-4"/>Share
                    {shareOpen ? <ChevronUp className="ml-1 h-4 w-4"/> : <ChevronDown className="ml-1 h-4 w-4"/>}
                  </Button>
                  <AnimatePresence>
                    {shareOpen && (
                      <motion.div 
                        initial={{opacity:0, y:-10}} 
                        animate={{opacity:1, y:0}} 
                        exit={{opacity:0, y:-10}} 
                        className="absolute right-0 mt-2 w-48 bg-background border rounded-lg shadow-lg p-2 space-y-2 z-10"
                      >
                        <Button variant="ghost" size="sm" className="w-full justify-start" onClick={handleCopy}>
                          <Copy className="mr-2 h-4 w-4"/>Copy Link
                        </Button>
                        <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
                          <a href={`mailto:?subject=Here's your converted file&body=Download it here: ${downloadUrl}`} className="flex items-center w-full">
                            <ArrowRight className="mr-2 h-4 w-4"/>Email
                          </a>
                        </Button>
                        <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => window.open(downloadUrl,"_blank")}>
                          <Eye className="mr-2 h-4 w-4"/>Preview
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              
              <Button variant="link" size="sm" onClick={() => setMetaOpen(o => !o)}>
                <FileText className="mr-1 h-4 w-4"/>{metaOpen ? "Hide Details" : "Show Details"}
              </Button>
              
              <AnimatePresence>
                {metaOpen && (
                  <motion.pre 
                    initial={{height:0, opacity:0}} 
                    animate={{height:"auto", opacity:1}} 
                    exit={{height:0, opacity:0}} 
                    className="overflow-auto text-xs bg-muted p-2 rounded"
                  >
                    <code>{JSON.stringify({filename, fileExtension, fileSize}, null, 2)}</code>
                  </motion.pre>
                )}
              </AnimatePresence>
            </div>
            
            <div className="pt-4 border-t border-border">
              <Button variant="outline" size="sm" className="w-full" onClick={onConvertAnother}>
                Convert Another File
              </Button>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </div>
  );
}