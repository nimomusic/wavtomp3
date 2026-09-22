import React, { useState, useRef, useEffect } from 'react';

interface MenuBarProps {
  onOpenFile: () => void;
  onChangeOutputDir: () => void;
  onSelectVbr: () => void;
  onSelectCbr: () => void;
  onShowAbout: () => void;
  onDownloadSingleHtml: () => void;
  onDownloadZip: () => void;
  onDownloadExe: () => void;
  onOpenExeModal: () => void;
}

export const MenuBar: React.FC<MenuBarProps> = ({
  onOpenFile,
  onChangeOutputDir,
  onSelectVbr,
  onSelectCbr,
  onShowAbout,
  onDownloadSingleHtml,
  onDownloadZip,
  onDownloadExe,
  onOpenExeModal,
}) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMenu = (menu: string) => {
    setActiveMenu(activeMenu === menu ? null : menu);
  };

  return (
    <div
      ref={menuRef}
      id="desktop-menubar"
      className="bg-[#ecefe6]/95 border-b border-[#cbd5e1] text-xs text-slate-700 px-2 py-0.5 flex items-center gap-1 select-none font-sans relative z-30"
    >
      {/* 파일(File) Menu */}
      <div className="relative">
        <button
          id="menu-btn-file"
          onClick={() => toggleMenu('file')}
          className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
            activeMenu === 'file'
              ? 'bg-blue-600 text-white'
              : 'hover:bg-slate-200/80 text-slate-800'
          }`}
        >
          파일(<u>F</u>)
        </button>

        {activeMenu === 'file' && (
          <div className="absolute left-0 top-full mt-0.5 w-60 bg-white border border-slate-300 shadow-lg rounded-sm py-1 z-40 text-xs text-slate-800">
            <button
              onClick={() => {
                setActiveMenu(null);
                onOpenFile();
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex justify-between items-center cursor-pointer"
            >
              <span>WAV 파일 열기...</span>
              <span className="text-[10px] text-slate-400">Ctrl+O</span>
            </button>
            <button
              onClick={() => {
                setActiveMenu(null);
                onChangeOutputDir();
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex justify-between items-center cursor-pointer"
            >
              <span>저장 폴더 변경...</span>
              <span className="text-[10px] text-slate-400">Ctrl+D</span>
            </button>
            <div className="border-t border-slate-200 my-1"></div>
            <button
              onClick={() => {
                setActiveMenu(null);
                onDownloadZip();
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex justify-between items-center cursor-pointer"
            >
              <span className="font-semibold text-blue-700 hover:text-white">Windows 안전 패키지 받기</span>
              <span className="text-[10px] bg-blue-100 text-blue-800 px-1 rounded font-mono font-bold">.zip 권장</span>
            </button>
            <button
              onClick={() => {
                setActiveMenu(null);
                onDownloadSingleHtml();
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex justify-between items-center cursor-pointer"
            >
              <span className="font-medium text-emerald-800 hover:text-white">단일 HTML 배포 파일 받기</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1 rounded font-mono">.html 무설치</span>
            </button>
            <button
              onClick={() => {
                setActiveMenu(null);
                onOpenExeModal();
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex justify-between items-center cursor-pointer"
            >
              <span>배포 및 바이러스 오탐 안내...</span>
              <span className="text-[10px] text-slate-400 hover:text-white">가이드</span>
            </button>
            <div className="border-t border-slate-200 my-1"></div>
            <button
              onClick={() => {
                setActiveMenu(null);
                if (confirm('변환기를 초기화하시겠습니까?')) {
                  window.location.reload();
                }
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-red-500 hover:text-white flex justify-between items-center cursor-pointer"
            >
              <span>초기화 및 새로고침</span>
              <span className="text-[10px] text-slate-400">F5</span>
            </button>
          </div>
        )}
      </div>

      {/* 설정(Options) Menu */}
      <div className="relative">
        <button
          id="menu-btn-options"
          onClick={() => toggleMenu('options')}
          className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
            activeMenu === 'options'
              ? 'bg-blue-600 text-white'
              : 'hover:bg-slate-200/80 text-slate-800'
          }`}
        >
          설정(<u>O</u>)
        </button>

        {activeMenu === 'options' && (
          <div className="absolute left-0 top-full mt-0.5 w-60 bg-white border border-slate-300 shadow-lg rounded-sm py-1 z-40 text-xs text-slate-800">
            <button
              onClick={() => {
                setActiveMenu(null);
                onSelectVbr();
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex justify-between items-center cursor-pointer"
            >
              <span>VBR (가변 비트레이트) 모드</span>
              <span className="text-[10px] text-slate-400">권장</span>
            </button>
            <button
              onClick={() => {
                setActiveMenu(null);
                onSelectCbr();
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex justify-between items-center cursor-pointer"
            >
              <span>CBR (고정 비트레이트) 모드</span>
            </button>
          </div>
        )}
      </div>

      {/* 도움말(Help) Menu */}
      <div className="relative">
        <button
          id="menu-btn-help"
          onClick={() => toggleMenu('help')}
          className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
            activeMenu === 'help'
              ? 'bg-blue-600 text-white'
              : 'hover:bg-slate-200/80 text-slate-800'
          }`}
        >
          도움말(<u>H</u>)
        </button>

        {activeMenu === 'help' && (
          <div className="absolute left-0 top-full mt-0.5 w-60 bg-white border border-slate-300 shadow-lg rounded-sm py-1 z-40 text-xs text-slate-800">
            <button
              onClick={() => {
                setActiveMenu(null);
                onShowAbout();
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex justify-between items-center cursor-pointer"
            >
              <span>WAV to MP3 변환기 정보...</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
