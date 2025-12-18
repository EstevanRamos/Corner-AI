import React, { useRef, useState, useEffect } from 'react';
import TimestampMarker, { Timestamp } from './TimestampMarker';
import { secondsToTimestamp } from '../../lib/video-processing';

interface VideoPlayerProps {
  src: string;
  timestamps?: Timestamp[];
  onTimestampClick?: (timestamp: Timestamp) => void;
  showTimestampMarkers?: boolean;
  activeTimestamp?: Timestamp | null; // Added for external control
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  src, 
  timestamps = [], 
  onTimestampClick, 
  showTimestampMarkers = true,
  activeTimestamp
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(false);

  // Watch for external timestamp changes to seek
  useEffect(() => {
    if (activeTimestamp && videoRef.current) {
      seek(activeTimestamp.seconds);
      // Optional: Auto-play on seek if desired, but sticking to just seeking for now
      // videoRef.current.play();
      // setIsPlaying(true);
    }
  }, [activeTimestamp]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!videoRef.current) return;
      
      switch(e.key) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          seek(currentTime - 5);
          break;
        case 'ArrowRight':
          seek(currentTime + 5);
          break;
        case 'ArrowUp':
          handleVolumeChange(Math.min(1, volume + 0.1));
          break;
        case 'ArrowDown':
          handleVolumeChange(Math.max(0, volume - 0.1));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTime, volume, isPlaying]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const seek = (time: number) => {
    if (videoRef.current) {
      const newTime = Math.max(0, Math.min(time, duration));
      // Check if finite to prevent errors
      if (isFinite(newTime)) {
        videoRef.current.currentTime = newTime;
        setCurrentTime(newTime);
      }
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (progressRef.current && videoRef.current) {
      const rect = progressRef.current.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      seek(pos * duration);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    if (videoRef.current) {
      videoRef.current.volume = newVol;
      setVolume(newVol);
    }
  };

  const changePlaybackRate = (rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
    }
  };

  const stepFrame = (frames: number) => {
    // Assuming 30fps
    seek(currentTime + (frames * 0.033));
  };

  const handleMarkerClick = (ts: Timestamp) => {
    seek(ts.seconds);
    if (onTimestampClick) onTimestampClick(ts);
  };

  return (
    <div 
      className="relative group bg-black rounded-xl overflow-hidden shadow-2xl border border-slate-800"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={src}
        className="w-full h-auto max-h-[70vh] object-contain cursor-pointer"
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
      />

      {/* Controls Overlay */}
      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 transition-opacity duration-300 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'}`}>
        
        {/* Progress Bar */}
        <div 
          ref={progressRef}
          className="relative h-2 bg-slate-700 rounded-full cursor-pointer mb-4 group/progress"
          onClick={handleProgressClick}
        >
          {/* Buffered/Played */}
          <div 
            className="absolute top-0 left-0 h-full bg-red-600 rounded-full" 
            style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
          />
          
          {/* Timestamp Markers */}
          {showTimestampMarkers && timestamps.map((ts, idx) => (
            <TimestampMarker 
              key={idx} 
              timestamp={ts} 
              duration={duration} 
              onClick={handleMarkerClick} 
            />
          ))}

          {/* Scrubber Tooltip (on hover) - could add later */}
        </div>

        {/* Main Controls */}
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-4">
            <button onClick={togglePlay} className="hover:text-red-500 transition-colors">
              {isPlaying ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              )}
            </button>
            
            <span className="font-mono text-xs text-slate-300">
              {secondsToTimestamp(currentTime)} / {secondsToTimestamp(duration)}
            </span>

            {/* Volume */}
            <div className="flex items-center gap-2 group/vol">
              <svg className="w-5 h-5 text-slate-400" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.1" 
                value={volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-20 accent-red-600 h-1 bg-slate-600 rounded-lg cursor-pointer opacity-0 group-hover/vol:opacity-100 transition-opacity" 
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
             {/* Frame Stepping */}
             <div className="flex gap-1 border border-slate-700 rounded p-0.5">
               <button onClick={() => stepFrame(-1)} className="p-1 hover:bg-slate-700 text-slate-400 text-xs" title="Prev Frame">
                 &lt;|
               </button>
               <button onClick={() => stepFrame(1)} className="p-1 hover:bg-slate-700 text-slate-400 text-xs" title="Next Frame">
                 |&gt;
               </button>
             </div>

             {/* Speed Control */}
             <select 
              value={playbackRate} 
              onChange={(e) => changePlaybackRate(parseFloat(e.target.value))}
              className="bg-transparent text-xs font-mono text-slate-400 border border-slate-700 rounded px-1 py-0.5 focus:outline-none focus:border-red-500"
             >
               <option value="0.25">0.25x</option>
               <option value="0.5">0.5x</option>
               <option value="1">1.0x</option>
               <option value="1.5">1.5x</option>
               <option value="2">2.0x</option>
             </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;