import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

/**
 * Converts a timestamp string (MM:SS) to seconds.
 */
export function timestampToSeconds(timestamp: string): number {
  const parts = timestamp.split(':').map(Number);
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 0;
}

/**
 * Converts seconds to a timestamp string (MM:SS).
 */
export function secondsToTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
}

/**
 * Extracts metadata from a video file using HTML5 Video API.
 */
export async function getVideoMetadata(file: File): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      resolve({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
      });
    };
    video.onerror = () => {
      reject(new Error('Invalid video file'));
    };
    video.src = window.URL.createObjectURL(file);
  });
}

/**
 * Generates a thumbnail image from a video at a specific time.
 */
export async function generateThumbnail(file: File, timeInSeconds: number = 1): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.currentTime = timeInSeconds;
    video.preload = 'auto'; // Load enough to render the frame

    const onSeeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        resolve(dataUrl);
      } else {
        reject(new Error('Canvas context not available'));
      }
      // Cleanup
      video.removeEventListener('seeked', onSeeked);
      window.URL.revokeObjectURL(video.src);
    };

    video.onloadeddata = () => {
      video.currentTime = timeInSeconds;
    };

    video.onseeked = onSeeked;

    video.onerror = () => {
      reject(new Error('Error processing video for thumbnail'));
    };

    video.src = window.URL.createObjectURL(file);
  });
}

/**
 * Extracts a clip from a video (Mock implementation for browser).
 */
export async function extractClip(
  videoUrl: string,
  startTime: number,
  endTime: number
): Promise<string> {
  console.warn("Client-side clipping not fully implemented without ffmpeg.wasm. Returning original URL.");
  return videoUrl; // Placeholder
}


// --- FFMPEG COMPRESSION ---

let ffmpeg: FFmpeg | null = null;

/**
 * Compresses video and removes audio using FFmpeg.wasm.
 * Falls back to original file if FFmpeg cannot load (e.g. missing COOP/COEP headers).
 */
export async function compressVideo(
  file: File, 
  onProgress?: (progress: number) => void
): Promise<File> {
  try {
    if (!ffmpeg) {
      ffmpeg = new FFmpeg();
    }

    if (!ffmpeg.loaded) {
      // Use unpkg URLs for core
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
    }

    const inputName = 'input.mp4';
    const outputName = 'output.mp4';

    await ffmpeg.writeFile(inputName, await fetchFile(file));

    // FFmpeg log handler for progress
    ffmpeg.on('progress', ({ progress }) => {
      if (onProgress) onProgress(Math.round(progress * 100));
    });

    // Command: 
    // -i input -c:v libx264 -crf 28 (high compression) 
    // -preset ultrafast (speed over size) 
    // -an (remove audio) 
    // -vf scale=-2:720 (downscale to 720p height max, keep aspect)
    await ffmpeg.exec([
      '-i', inputName,
      '-vf', 'scale=-2:720', 
      '-c:v', 'libx264', 
      '-crf', '28', 
      '-preset', 'ultrafast', 
      '-an', 
      outputName
    ]);

    const data = await ffmpeg.readFile(outputName);
    const compressedBlob = new Blob([data as Uint8Array], { type: 'video/mp4' });
    
    // Cleanup
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);

    return new File([compressedBlob], file.name, { type: 'video/mp4' });

  } catch (err) {
    console.error("FFmpeg Compression Failed:", err);
    console.warn("Returning original file due to compression failure (likely missing SharedArrayBuffer support in this environment).");
    return file;
  }
}