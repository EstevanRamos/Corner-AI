import React, { useCallback, useState } from 'react';
import { useVideoUpload, UploadedVideo } from '../../hooks/useVideoUpload';

interface VideoUploaderProps {
  onUploadComplete: (video: UploadedVideo, file: File) => void;
  onError?: (error: Error) => void;
  maxSizeMB?: number;
  allowedFormats?: string[];
  label?: string;
  className?: string;
}

const VideoUploader: React.FC<VideoUploaderProps> = ({
  onUploadComplete,
  onError,
  maxSizeMB = 500,
  allowedFormats = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'],
  label = 'Drop video here or click to browse',
  className = '',
}) => {
  const { upload, progress, isUploading, error } = useVideoUpload();
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    // Validate file type
    if (!allowedFormats.includes(file.type)) {
      const err = new Error(`Invalid file type. Allowed: ${allowedFormats.join(', ')}`);
      onError?.(err);
      return;
    }

    // Validate file size
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      const err = new Error(`File too large. Maximum size: ${maxSizeMB}MB`);
      onError?.(err);
      return;
    }

    try {
      const video = await upload(file);
      onUploadComplete(video, file);
    } catch (err) {
      onError?.(err instanceof Error ? err : new Error('Upload failed'));
    }
  }, [upload, onUploadComplete, onError, allowedFormats, maxSizeMB]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`
        relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
        ${isDragging 
          ? 'border-emerald-500 bg-emerald-500/10' 
          : 'border-slate-600 hover:border-slate-500 bg-slate-900/50'
        }
        ${isUploading ? 'pointer-events-none opacity-70' : ''}
        ${className}
      `}
    >
      <input
        type="file"
        accept={allowedFormats.join(',')}
        onChange={handleInputChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={isUploading}
      />

      {isUploading ? (
        <div className="space-y-3">
          <div className="w-12 h-12 mx-auto border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400">Uploading... {progress}%</p>
          <div className="w-full max-w-xs mx-auto bg-slate-700 rounded-full h-2">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="w-16 h-16 mx-auto bg-slate-800 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <p className="text-slate-400">{label}</p>
          <p className="text-slate-600 text-sm">
            MP4, WebM, MOV • Max {maxSizeMB}MB
          </p>
        </div>
      )}

      {error && (
        <p className="mt-3 text-red-400 text-sm">{error.message}</p>
      )}
    </div>
  );
};

export default VideoUploader;