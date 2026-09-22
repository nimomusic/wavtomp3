import React, { useState, useRef } from 'react';
import { Folder, HardDrive, Check, X, FolderOpen, Laptop, CheckCircle2 } from 'lucide-react';

interface FolderDialogModalProps {
  isOpen: boolean;
  currentPath: string;
  currentDirHandle?: FileSystemDirectoryHandle | null;
  onSelect: (newPath: string, dirHandle?: FileSystemDirectoryHandle | null) => void;
  onClose: () => void;
}

const LOCAL_PRESET_PATHS = [
  { name: '다운로드 (Downloads)', path: 'C:\\Users\\Downloads', startIn: 'downloads' },
  { name: '바탕화면 (Desktop)', path: 'C:\\Users\\Desktop', startIn: 'desktop' },
  { name: '음악 폴더 (Music)', path: 'C:\\Users\\Music', startIn: 'music' },
  { name: '문서 폴더 (Documents)', path: 'C:\\Users\\Documents', startIn: 'documents' },
];

export const FolderDialogModal: React.FC<FolderDialogModalProps> = ({
  isOpen,
  currentPath,
  currentDirHandle,
  onSelect,
  onClose,
}) => {
  const [selectedPath, setSelectedPath] = useState(currentPath || 'C:\\Users\\Downloads');
  const [localConnectedFolder, setLocalConnectedFolder] = useState<string | null>(
    currentDirHandle ? currentDirHandle.name : null
  );
  const [localDirHandle, setLocalDirHandle] = useState<FileSystemDirectoryHandle | null>(
    currentDirHandle || null
  );
  const [isPickerActive, setIsPickerActive] = useState(false);
  const folderInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Real local directory picker for the user's computer
  const handleBrowseLocalComputer = async (startIn?: string) => {
    setIsPickerActive(true);
    try {
      if ('showDirectoryPicker' in window) {
        // Modern Chromium File System Access API (Chrome, Edge, Whale, App mode)
        const opts: { mode: 'readwrite'; startIn?: string } = { mode: 'readwrite' };
        if (startIn) {
          opts.startIn = startIn;
        }
        const dirHandle = await (window as unknown as {
          showDirectoryPicker: (options?: { mode?: string; startIn?: string }) => Promise<FileSystemDirectoryHandle>;
        }).showDirectoryPicker(opts);

        if (dirHandle && dirHandle.name) {
          const folderName = dirHandle.name;
          setLocalConnectedFolder(folderName);
          setLocalDirHandle(dirHandle);
          setSelectedPath(folderName);
        }
      } else {
        // Fallback for browsers without showDirectoryPicker
        folderInputRef.current?.click();
      }
    } catch (err: unknown) {
      const error = err as { name?: string };
      if (error?.name !== 'AbortError') {
        // If showDirectoryPicker is blocked or cancelled, trigger input fallback
        folderInputRef.current?.click();
      }
    } finally {
      setIsPickerActive(false);
    }
  };

  const handleFolderInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const firstFile = e.target.files[0];
      const relPath = firstFile.webkitRelativePath || '';
      const folderName = relPath.split('/')[0] || 'SelectedFolder';
      setLocalConnectedFolder(folderName);
      setSelectedPath(folderName);
    }
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs">
      <div className="bg-[#f0f4f8] text-slate-800 w-full max-w-lg rounded-lg shadow-2xl border border-slate-400 flex flex-col overflow-hidden text-xs">
        {/* Hidden Directory Input Fallback */}
        <input
          ref={folderInputRef}
          type="file"
          {...({ webkitdirectory: '', directory: '' } as unknown as React.InputHTMLAttributes<HTMLInputElement>)}
          multiple
          className="hidden"
          onChange={handleFolderInputChange}
        />

        {/* Title bar of dialog */}
        <div className="bg-[#2b3a4a] text-slate-100 px-3.5 py-2 flex items-center justify-between font-semibold text-xs select-none">
          <div className="flex items-center gap-2">
            <Folder className="w-4 h-4 text-yellow-400" />
            <span className="tracking-tight">저장 대상 폴더 선택</span>
          </div>
          <button
            onClick={onClose}
            className="w-5 h-5 flex items-center justify-center hover:bg-red-600 rounded text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Dialog Content */}
        <div className="p-4 flex flex-col gap-3.5">
          {/* Primary Action: Select Local Folder from Current Computer */}
          <div className="bg-white border-2 border-blue-200 rounded-lg p-3 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                <Laptop className="w-4 h-4 text-blue-600" />
                <span>내 컴퓨터에서 저장 폴더 선택</span>
              </span>
              <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                로컬 PC 탐색기
              </span>
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed">
              버튼을 누르면 현재 컴퓨터의 탐색기 창이 열려 C: 드라이브, D: 드라이브, 바탕화면, 다운로드 등 원하는 폴더를 직접 선택할 수 있습니다.
            </p>

            <button
              type="button"
              id="btn-browse-local-pc"
              onClick={() => handleBrowseLocalComputer()}
              disabled={isPickerActive}
              className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white font-bold rounded-md flex items-center justify-center gap-2 shadow transition-all cursor-pointer text-xs"
            >
              <FolderOpen className="w-4 h-4 text-yellow-300 shrink-0" />
              <span>{isPickerActive ? '탐색기 여는 중...' : '내 컴퓨터에서 로컬 폴더 찾아보기...'}</span>
            </button>

            {localConnectedFolder && (
              <div className="bg-emerald-50 border border-emerald-300 rounded p-2 text-[11px] text-emerald-800 flex items-center gap-2 mt-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <div className="truncate">
                  <span className="font-bold">선택된 로컬 폴더: </span>
                  <span className="font-mono font-semibold text-emerald-900 bg-white px-1.5 py-0.5 rounded border border-emerald-200">
                    {localConnectedFolder}
                  </span>
                  <span className="text-emerald-700 ml-1.5 text-[10px]">(변환 시 이 폴더에 직접 저장됩니다)</span>
                </div>
              </div>
            )}
          </div>

          {/* Path Display & Direct Edit */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1 text-[11px]">
              선택된 저장 경로 (기본 C: 다운로드 폴더 / 직접 입력 가능):
            </label>
            <div className="flex gap-1.5">
              <input
                id="input-selected-folder-path"
                type="text"
                value={selectedPath}
                onChange={(e) => setSelectedPath(e.target.value)}
                placeholder="C:\Users\Downloads"
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-mono text-[11px] text-slate-900 focus:outline-blue-500 shadow-2xs"
              />
            </div>
          </div>

          {/* Quick Windows Drive Presets */}
          <div>
            <span className="block text-slate-600 font-semibold mb-1.5 flex items-center gap-1 text-[11px]">
              <HardDrive className="w-3.5 h-3.5 text-slate-500" />
              <span>Windows 기본 위치 바로 지정:</span>
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {LOCAL_PRESET_PATHS.map((item) => (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => {
                    if ('showDirectoryPicker' in window) {
                      handleBrowseLocalComputer(item.startIn);
                    } else {
                      setSelectedPath(item.path);
                      setLocalConnectedFolder(null);
                      setLocalDirHandle(null);
                    }
                  }}
                  className={`text-left px-2.5 py-1.5 rounded border transition-colors flex items-center justify-between text-[11px] cursor-pointer ${
                    selectedPath === item.path || selectedPath === item.name
                      ? 'bg-blue-50 border-blue-400 font-semibold text-blue-900'
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="truncate pr-1">
                    <div className="font-medium truncate">{item.name}</div>
                    <div className="font-mono text-[10px] text-slate-400 truncate">{item.path}</div>
                  </div>
                  {(selectedPath === item.path || selectedPath === item.name) && (
                    <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Dialog Footer */}
        <div className="bg-slate-200/80 px-4 py-2.5 border-t border-slate-300 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded text-slate-700 font-medium cursor-pointer shadow-2xs"
          >
            취소
          </button>
          <button
            type="button"
            id="btn-confirm-folder-select"
            onClick={() => {
              onSelect(selectedPath || 'C:\\Users\\Downloads', localDirHandle);
              onClose();
            }}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded shadow cursor-pointer transition-colors"
          >
            폴더 선택
          </button>
        </div>
      </div>
    </div>
  );
};
