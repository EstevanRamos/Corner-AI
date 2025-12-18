import { useState, useCallback } from 'react';

export interface UploadedVideo {
  id: string;
  filename: string;
  url: string;
  thumbnailUrl?: string;
  duration: number;
  size: number;
  mimeType: string;
  uploadedAt: Date;
  file: File;
}

interface UseVideoUploadReturn {
  upload: (file: File) => Promise<UploadedVideo>;
  progress: number;
  isUploading: boolean;
  error: Error | null;
  reset: () => void;
}

export function useVideoUpload(): UseVideoUploadReturn {
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const reset = useCallback(() => {
    setProgress(0);
    setIsUploading(false);
    setError(null);
  }, []);

  const upload = useCallback(async (file: File): Promise<UploadedVideo> => {
    setIsUploading(true);
    setError(null);
    setProgress(0);

    try {
      // Create object URL for local preview
      const url = URL.createObjectURL(file);

      // Get video duration
      const duration = await getVideoDuration(file);

      setProgress(100);

      const uploadedVideo: UploadedVideo = {
        id: crypto.randomUUID(),
        filename: file.name,
        url,
        duration,
        size: file.size,
        mimeType: file.type,
        uploadedAt: new Date(),
        file,
      };

      setIsUploading(false);
      return uploadedVideo;

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Upload failed');
      setError(error);
      setIsUploading(false);
      throw error;
    }
  }, []);

  return {
    upload,
    progress,
    isUploading,
    error,
    reset,
  };
}

async function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };

    video.onerror = () => {
      reject(new Error('Failed to load video metadata'));
    };

    video.src = URL.createObjectURL(file);
  });
}

export default useVideoUpload;