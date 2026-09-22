import React, { useState } from 'react';
import {
  Folder,
  X,
  FolderOpen,
  Laptop,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Download,
  Info,
  ExternalLink,
  ShieldCheck,
  Check,
} from 'lucide-react';

interface FolderDialogModalProps {
  isOpen: boolean;
  currentPath: string;
  currentDirHandle?: FileSystemDirectoryHandle | null;
  autoSaveEnabled: boolean;
  onToggleAutoSave: (enabled: boolean) => void;
  onSelect: (newPath: string, dirHandle?: FileSystemDirectoryHandle | null) => void;
  onClose: () => void;
}

export const FolderDialogModal: React.FC<FolderDialogModalProps> = ({
  isOpen,
  currentPath,
  currentDirHandle,
  autoSaveEnabled,
  onToggleAutoSave,
  onSelect,
  onClose,
}) => {
  const isFolderPickerSupported = typeof window !== 'undefined' && 'showDirectoryPicker' in window;

  const [localConnectedFolder, setLocalConnectedFolder] = useState<string | null>(
    currentDirHandle ? currentDirHandle.name : null
  );
  const [localDirHandle, setLocalDirHandle] = useState<FileSystemDirectoryHandle | null>(
    currentDirHandle || null
  );
  const [isPickerActive, setIsPickerActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Real local directory picker for desktop Chromium browsers
  const handleBrowseLocalComputer = async () => {
    setIsPickerActive(true);
    setErrorMessage(null);
    try {
      if ('showDirectoryPicker' in window) {
        const dirHandle = await (window as unknown as {
          showDirectoryPicker: (options?: { mode?: string }) => Promise<FileSystemDirectoryHandle>;
        }).showDirectoryPicker({ mode: 'readwrite' });

        if (dirHandle && dirHandle.name) {
          // Request and verify readwrite permission
          if ('requestPermission' in dirHandle) {
            const perm = await (dirHandle as unknown as {
              requestPermission: (options: { mode: string }) => Promise<string>;
            }).requestPermission({ mode: 'readwrite' });

            if (perm !== 'granted') {
              setErrorMessage('선택한 폴더에 파일을 저장하려면 브라우저 쓰기 권한 허용이 필요합니다.');
              return;
            }
          }

          setLocalConnectedFolder(dirHandle.name);
          setLocalDirHandle(dirHandle);
        }
      }
    } catch (err: unknown) {
      const error = err as { name?: string };
      if (error?.name !== 'AbortError') {
        console.error('Directory picker error:', err);
        setErrorMessage('폴더 선택 중 문제가 발생했습니다. 브라우저 기본 다운로드 폴더를 이용해 주세요.');
      }
    } finally {
      setIsPickerActive(false);
    }
  };

  const handleUseDefaultDownloads = () => {
    setLocalConnectedFolder(null);
    setLocalDirHandle(null);
    setErrorMessage(null);
  };

  const handleSaveAndClose = () => {
    if (localDirHandle) {
      onSelect(localDirHandle.name, localDirHandle);
    } else {
      onSelect('브라우저 기본 다운로드 폴더', null);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/55 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs">
      <div className="bg-[#f8fafc] text-slate-800 w-full max-w-lg rounded-xl shadow-2xl border border-slate-300 flex flex-col overflow-hidden text-xs">
        {/* Title bar */}
        <div className="bg-[#1e293b] text-slate-100 px-4 py-2.5 flex items-center justify-between font-semibold text-xs select-none">
          <div className="flex items-center gap-2">
            <Folder className="w-4 h-4 text-amber-400" />
            <span className="tracking-tight">저장 대상 위치 및 자동 저장 설정</span>
          </div>
          <button
            onClick={onClose}
            className="w-5 h-5 flex items-center justify-center hover:bg-red-600 rounded text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
          {/* Device Specific Section */}
          {!isFolderPickerSupported ? (
            /* Mobile / Tablet Guide */
            <div className="bg-amber-50/90 border border-amber-200 rounded-lg p-3.5 space-y-2.5">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                <Smartphone className="w-4 h-4 text-amber-600 shrink-0" />
                <span>스마트폰 & 태블릿(모바일) 저장 안내</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                iOS(아이폰/아이패드) 및 Android(갤럭시 등) 모바일 운영체제는 <strong>보안 정책상 웹 브라우저가 임의의 시스템 내부 폴더를 직접 탐색하는 것을 차단</strong>합니다.
              </p>
              <div className="bg-white/80 rounded border border-amber-200 p-2.5 space-y-1.5 text-[11px] text-slate-700">
                <div className="font-semibold text-amber-950 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>변환된 파일은 기기의 기본 [다운로드] 폴더로 안전하게 자동 저장됩니다:</span>
                </div>
                <div className="pl-5 space-y-1 text-slate-600">
                  <div>• <strong>아이폰/아이패드:</strong> [파일] 앱 ➔ [다운로드] 폴더에서 확인 가능</div>
                  <div>• <strong>갤럭시/안드로이드:</strong> [내 파일] 앱 ➔ [다운로드] 폴더에서 확인 가능</div>
                  <div>• <strong>ZIP 일괄 다운로드:</strong> 여러 파일을 변환한 경우 'ZIP 다운로드'를 누르면 파일 하나로 묶어 깔끔하게 보관할 수 있습니다.</div>
                </div>
              </div>
            </div>
          ) : (
            /* Computer Desktop Options */
            <div className="space-y-3">
              <div className="text-[11px] text-slate-600">
                컴퓨터 환경에서는 원하는 <strong>특정 폴더를 직접 지정</strong>하거나, 편리한 <strong>브라우저 기본 다운로드 폴더</strong>를 선택할 수 있습니다.
              </div>

              {/* Option 1: Pick Local Folder */}
              <div
                className={`border-2 rounded-lg p-3 transition-all ${
                  localConnectedFolder
                    ? 'border-blue-500 bg-blue-50/50 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                    <Laptop className="w-4 h-4 text-blue-600" />
                    <span>방법 1: 내 컴퓨터 폴더 직접 지정 (추천)</span>
                  </span>
                  {localConnectedFolder && (
                    <span className="bg-blue-600 text-white font-bold text-[10px] px-1.5 py-0.5 rounded">
                      현재 선택됨
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-600 mb-2.5">
                  버튼을 누르면 윈도우/맥 탐색기 창이 열립니다. 바탕화면, 음악 폴더, 외장하드 등 원하는 폴더를 선택하면 변환 완료 시 해당 위치에 파일이 직접 생성됩니다.
                </p>

                <button
                  type="button"
                  id="btn-modal-browse-computer"
                  onClick={handleBrowseLocalComputer}
                  disabled={isPickerActive}
                  className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white font-bold rounded flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
                >
                  <FolderOpen className="w-4 h-4 text-amber-300" />
                  <span>{isPickerActive ? '탐색기 창 여는 중...' : '내 컴퓨터에서 저장 폴더 찾아보기...'}</span>
                </button>

                {localConnectedFolder && (
                  <div className="bg-emerald-50 border border-emerald-300 rounded p-2 text-[11px] text-emerald-800 flex items-center gap-2 mt-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div className="truncate">
                      <span className="font-bold">연결된 폴더: </span>
                      <span className="font-mono font-semibold bg-white px-1.5 py-0.5 rounded border border-emerald-200">
                        {localConnectedFolder}
                      </span>
                      <span className="text-emerald-700 ml-1 text-[10px]">(변환 시 이 폴더에 즉시 저장)</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Option 2: Default Downloads Folder */}
              <div
                className={`border-2 rounded-lg p-3 transition-all ${
                  !localConnectedFolder
                    ? 'border-emerald-500 bg-emerald-50/40 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                    <Download className="w-4 h-4 text-emerald-600" />
                    <span>방법 2: 브라우저 기본 다운로드 폴더 (Downloads)</span>
                  </span>
                  {!localConnectedFolder && (
                    <span className="bg-emerald-600 text-white font-bold text-[10px] px-1.5 py-0.5 rounded">
                      현재 선택됨
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-600 mb-2">
                  폴더 권한 설정 없이, 크롬/엣지/사파리의 기본 다운로드 폴더(C:\Users\...\Downloads)로 간편하게 자동 저장합니다.
                </p>

                <button
                  type="button"
                  onClick={handleUseDefaultDownloads}
                  className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-semibold rounded text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Check className="w-3.5 h-3.5 text-slate-600" />
                  <span>기본 다운로드 폴더로 저장하기</span>
                </button>
              </div>

              {errorMessage && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-2 rounded text-[11px] flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
          )}

          {/* Common Option: Auto-save Checkbox */}
          <div className="bg-slate-100 p-3 rounded-lg border border-slate-200 space-y-1.5">
            <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800 text-xs select-none">
              <input
                id="checkbox-auto-save"
                type="checkbox"
                checked={autoSaveEnabled}
                onChange={(e) => onToggleAutoSave(e.target.checked)}
                className="w-4 h-4 text-blue-600 accent-blue-600 rounded cursor-pointer"
              />
              <span>변환 완료 시 파일 즉시 자동 저장 (권장)</span>
            </label>
            <p className="text-[10px] text-slate-500 pl-6 leading-relaxed">
              체크되어 있으면 각 파일이 변환될 때마다 수동으로 저장 버튼을 누를 필요 없이 지정된 폴더나 다운로드 폴더로 자동 저장됩니다.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 px-4 py-2.5 border-t border-slate-200 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded text-slate-700 font-semibold cursor-pointer shadow-2xs text-xs"
          >
            닫기
          </button>
          <button
            type="button"
            id="btn-modal-apply"
            onClick={handleSaveAndClose}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded shadow-xs cursor-pointer transition-colors text-xs flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>설정 적용</span>
          </button>
        </div>
      </div>
    </div>
  );
};
