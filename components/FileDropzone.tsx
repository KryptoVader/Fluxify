"use client";

import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileType, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { MAX_FILE_SIZE } from "@/lib/constants";

interface FileDropzoneProps {
  onFileAccepted: (file: File) => void;
  acceptedFileTypes?: Record<string, string[]>;
  className?: string;
}

export function FileDropzone({
  onFileAccepted,
  acceptedFileTypes,
  className,
}: FileDropzoneProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      
      if (file.size > MAX_FILE_SIZE) {
        setError(`File size exceeds the maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
        setSuccess(false);
        return;
      }

      setError(null);
      setSuccess(true);
      onFileAccepted(file);
      
      // Reset success after 2 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 2000);
    },
    [onFileAccepted]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: acceptedFileTypes,
    onDropRejected: () => {
      setError("Invalid file type or too many files");
      setSuccess(false);
    },
  });

  // Remove event handlers that conflict with Framer Motion's onDrag
  const {
    onDrag, onDragStart, onDragEnd, onDragOver, onDragEnter, onDragLeave, onDrop: onDropEvt,
    ...rootProps
  } = getRootProps();

  return (
    <div className={className}>
      <div
        {...rootProps}
        className={cn(
          "relative flex flex-col items-center justify-center w-full min-h-[240px] p-8 rounded-xl border-2 border-dashed transition-colors cursor-pointer",
          isDragActive && !isDragReject && "border-primary bg-primary/5",
          isDragReject && "border-destructive bg-destructive/5",
          error && "border-destructive bg-destructive/5",
          success && "border-green-500 bg-green-500/5",
          !isDragActive && !error && !success && "border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5"
        )}
      >
        <input {...getInputProps()} />
        <motion.div
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <AnimatePresence mode="wait">
            {error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center text-center"
              >
                <AlertCircle size={50} className="text-destructive mb-4" />
                <p className="text-destructive font-medium">{error}</p>
                <p className="text-muted-foreground mt-2 max-w-md">
                  Please try again with a valid file.
                </p>
              </motion.div>
            ) : success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center text-center"
              >
                <CheckCircle2 size={50} className="text-green-500 mb-4" />
                <p className="text-green-500 font-medium">File added successfully!</p>
              </motion.div>
            ) : (
              <motion.div
                key="dropzone"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center text-center"
              >
                {isDragActive ? (
                  <>
                    <FileType size={50} className="text-primary mb-4" />
                    <p className="text-xl font-medium text-primary">Drop your file here</p>
                  </>
                ) : (
                  <>
                    <Upload size={50} className="text-muted-foreground mb-4" />
                    <p className="text-xl font-medium">Drag & drop your file here</p>
                    <p className="text-muted-foreground mt-2 max-w-md">
                      or click to browse your files
                    </p>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
