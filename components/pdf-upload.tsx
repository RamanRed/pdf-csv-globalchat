'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  X,
  FileText,
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Filter,
} from 'lucide-react';
import { uploadFile } from '@/lib/api';
import type { FileFilterType } from '@/lib/types';

interface UploadedFile {
  id: string;
  file: File; // actual File reference for uploading
  name: string;
  size: number;
  type: 'pdf' | 'csv';
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

interface PDFUploadProps {
  onUploadSuccess?: (pdf: any) => void;
}

const FILE_CATEGORIES = [
  { value: 'pdf', label: 'PDF Document', icon: FileText, color: 'text-red-500', accept: '.pdf' },
  { value: 'csv', label: 'CSV Data', icon: FileSpreadsheet, color: 'text-green-600', accept: '.csv' },
];

export function PDFUpload({ onUploadSuccess }: PDFUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [filterType, setFilterType] = useState<FileFilterType>('all');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Drag & Drop ──
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  }, []);

  // ── File selection ──
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (selected) addFiles(Array.from(selected));
    e.target.value = '';
  };

  const addFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter((f) => {
      const ext = f.name.split('.').pop()?.toLowerCase();
      return ext === 'pdf' || ext === 'csv';
    });

    const uploadFiles: UploadedFile[] = validFiles.map((f) => ({
      id: crypto.randomUUID(),
      file: f,
      name: f.name,
      size: f.size,
      type: f.name.endsWith('.csv') ? 'csv' : 'pdf',
      status: 'pending',
    }));

    setFiles((prev) => [...prev, ...uploadFiles]);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // ── Upload all pending files ──
  const handleUploadAll = async () => {
    const pendingFiles = files.filter((f) => f.status === 'pending');
    if (pendingFiles.length === 0) return;

    setIsUploading(true);

    for (const file of pendingFiles) {
      setFiles((prev) =>
        prev.map((f) => (f.id === file.id ? { ...f, status: 'uploading' } : f))
      );

      try {
        const pdf = await uploadFile(file.file);

        setFiles((prev) =>
          prev.map((f) => (f.id === file.id ? { ...f, status: 'success' } : f))
        );

        onUploadSuccess?.(pdf);
      } catch (err) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === file.id
              ? { ...f, status: 'error', error: err instanceof Error ? err.message : 'Upload failed' }
              : f
          )
        );
      }
    }

    setIsUploading(false);
  };

  // ── Filtered file list ──
  const filteredFiles =
    filterType === 'all'
      ? files
      : files.filter((f) => f.type === filterType);

  const pendingCount = files.filter((f) => f.status === 'pending').length;
  const successCount = files.filter((f) => f.status === 'success').length;

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  return (
    <Card className="p-6 bg-card border border-border">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground text-lg">Upload Documents</h3>
            <p className="text-sm text-muted-foreground">
              Drag & drop or browse to upload PDF and CSV files
            </p>
          </div>
          {files.length > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {files.length} file{files.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          )}
        </div>

        {/* Drop zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-primary bg-primary/5 scale-[1.01]'
              : 'border-border hover:border-primary/40 hover:bg-secondary/30'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.csv"
            multiple
            onChange={handleFileChange}
          />
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-red-500" />
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-600/10 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {isDragging ? 'Drop files here' : 'Click or drag files to upload'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Supports PDF and CSV files up to 25MB
              </p>
            </div>
          </div>
        </div>

        {/* Filter tabs + file list */}
        {files.length > 0 && (
          <div className="space-y-3">
            {/* Filter bar */}
            <div className="flex items-center gap-2 overflow-x-auto">
              <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              {(['all', 'pdf', 'csv'] as const).map((type) => {
                const count =
                  type === 'all'
                    ? files.length
                    : files.filter((f) => f.type === type).length;
                if (type !== 'all' && count === 0) return null;
                return (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      filterType === type
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary/60 text-muted-foreground hover:bg-secondary'
                    }`}
                  >
                    {type === 'pdf' && <FileText className="w-3 h-3" />}
                    {type === 'csv' && <FileSpreadsheet className="w-3 h-3" />}
                    {type === 'all' ? 'All' : type.toUpperCase()} ({count})
                  </button>
                );
              })}
            </div>

            {/* File list */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filteredFiles.map((file) => {
                const FileIcon = file.type === 'csv' ? FileSpreadsheet : FileText;
                const iconColor = file.type === 'csv' ? 'text-green-600' : 'text-red-500';

                return (
                  <div
                    key={file.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background hover:bg-secondary/20 transition-colors"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      file.type === 'csv' ? 'bg-green-600/10' : 'bg-red-500/10'
                    }`}>
                      <FileIcon className={`w-4 h-4 ${iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {file.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatSize(file.size)}</span>
                        <span>•</span>
                        <span className="uppercase">{file.type}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {file.status === 'uploading' && (
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      )}
                      {file.status === 'success' && (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      )}
                      {file.status === 'error' && (
                        <AlertCircle className="w-4 h-4 text-destructive" />
                      )}
                      {file.status === 'pending' && (
                        <Badge variant="outline" className="text-xs">
                          Ready
                        </Badge>
                      )}
                      <button
                        onClick={() => removeFile(file.id)}
                        className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Upload action */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div className="text-xs text-muted-foreground">
                {pendingCount > 0 && <span>{pendingCount} pending</span>}
                {pendingCount > 0 && successCount > 0 && <span> · </span>}
                {successCount > 0 && <span>{successCount} uploaded</span>}
              </div>
              <Button
                onClick={handleUploadAll}
                disabled={pendingCount === 0 || isUploading}
                size="sm"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Uploading…
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5 mr-1.5" />
                    Upload {pendingCount > 0 ? `(${pendingCount})` : 'All'}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
