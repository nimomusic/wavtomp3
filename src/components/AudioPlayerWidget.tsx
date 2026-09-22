import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2 } from 'lucide-react';
import { formatDuration } from '../utils/audioConverter';

interface AudioPlayerWidgetProps {
  title: string;
  url: string;
  badgeText?: string;
  badgeColor?: 'blue' | 'emerald';
}

export const AudioPlayerWidget: React.FC<AudioPlayerWidgetProps> = ({
  title,
  url,
  badgeText,
  badgeColor = 'blue',
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
  }, [url]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleReset = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
    }
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded p-2.5 flex flex-col gap-1.5 text-xs">
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />

      <div className="flex items-center justify-between text-slate-700">
        <div className="flex items-center gap-1.5 font-medium truncate">
          <Volume2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="truncate">{title}</span>
        </div>
        {badgeText && (
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-mono shrink-0 font-medium ${
              badgeColor === 'emerald'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-blue-100 text-blue-800 border border-blue-300'
            }`}
          >
            {badgeText}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={togglePlay}
          className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center shrink-0 shadow-sm transition-transform active:scale-95"
          title={isPlaying ? '일시 정지' : '재생'}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
        </button>

        <button
          type="button"
          onClick={handleReset}
          className="w-6 h-6 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center shrink-0"
          title="처음으로"
        >
          <RotateCcw className="w-3 h-3" />
        </button>

        <input
          type="range"
          min={0}
          max={duration || 1}
          step={0.05}
          value={currentTime}
          onChange={handleSeek}
          className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded cursor-pointer"
        />

        <div className="text-[10px] font-mono text-slate-500 whitespace-nowrap">
          {formatDuration(currentTime)} / {formatDuration(duration)}
        </div>
      </div>
    </div>
  );
};
