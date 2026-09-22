import React from 'react';
import { Disc3, RotateCcw, Info } from 'lucide-react';

interface TitleBarProps {
  onReset: () => void;
  onShowInfo: () => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  onReset,
  onShowInfo,
}) => {
  return (
    <div
      id="desktop-titlebar"
      className="bg-[#2b3a4a] text-slate-200 select-none px-3 sm:px-4 py-2 flex items-center justify-between border-b border-[#1f2937] text-xs"
    >
      {/* Window Title */}
      <div className="flex items-center gap-2">
        <Disc3 className="w-4 h-4 text-blue-400 animate-spin-slow" />
        <span className="font-semibold text-slate-100 tracking-tight text-sm">
          WAV to MP3 Converter
        </span>
        <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-blue-900/60 text-blue-200 border border-blue-700/50">
          웹 브라우저 즉시 실행
        </span>
      </div>

      {/* Web Action Buttons */}
      <div className="flex items-center gap-1.5">
        <button
          id="btn-app-reset"
          onClick={onReset}
          className="px-2 py-1 flex items-center gap-1 rounded hover:bg-slate-700/70 text-slate-300 hover:text-white transition-colors cursor-pointer text-[11px]"
          title="변환기 초기화"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">초기화</span>
        </button>
        <button
          id="btn-app-info"
          onClick={onShowInfo}
          className="px-2 py-1 flex items-center gap-1 rounded hover:bg-slate-700/70 text-slate-300 hover:text-white transition-colors cursor-pointer text-[11px]"
          title="애플리케이션 정보"
        >
          <Info className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">정보</span>
        </button>
      </div>
    </div>
  );
};


