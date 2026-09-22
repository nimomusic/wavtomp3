import React, { useState, useRef, useEffect } from 'react';
import {
  FileAudio,
  FolderOpen,
  Sliders,
  Play,
  RotateCcw,
  Sparkles,
  Download,
  AlertCircle,
  CheckCircle2,
  Music,
  Disc3,
  Layers,
  StopCircle,
  Plus,
  Trash2,
  ExternalLink,
  Globe,
  Headphones,
  Archive,
  Volume2,
  Laptop,
  FileCode,
} from 'lucide-react';
import JSZip from 'jszip';
import { TitleBar } from './components/TitleBar';
import { AudioPlayerWidget } from './components/AudioPlayerWidget';
import { FolderDialogModal } from './components/FolderDialogModal';
import {
  BatchItem,
  CbrBitrate,
  ConversionProgress,
  EncodingMode,
  VbrQuality,
} from './types';
import {
  CBR_BITRATE_INFO,
  VBR_QUALITY_INFO,
  convertWavToMp3,
  createSampleWav,
  decodeAudioFile,
  formatBytes,
  formatDuration,
} from './utils/audioConverter';

export default function App() {
  // Modal State
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);

  // Batch Files State
  const [files, setFiles] = useState<BatchItem[]>([]);
  const [selectedPreviewId, setSelectedPreviewId] = useState<string | null>(null);
  const [outputDir, setOutputDir] = useState('C:\\Users\\Downloads');
  const [outputDirHandle, setOutputDirHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const outputDirHandleRef = useRef<FileSystemDirectoryHandle | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  // Encoding Options State
  const [mode, setMode] = useState<EncodingMode>('VBR');
  const [vbrQuality, setVbrQuality] = useState<VbrQuality>(2); // Default V2
  const [cbrBitrate, setCbrBitrate] = useState<CbrBitrate>(192); // Default 192kbps

  // Conversion Execution State
  const [isConverting, setIsConverting] = useState(false);
  const [currentFileIndex, setCurrentFileIndex] = useState<number>(-1);
  const [currentProgress, setCurrentProgress] = useState<ConversionProgress>({
    percentage: 0,
    currentChunk: 0,
    totalChunks: 0,
    elapsedSeconds: 0,
    estimatedRemainingSeconds: 0,
    conversionSpeed: 0,
  });
  const [statusMessage, setStatusMessage] = useState('준비 완료 - WAV 파일을 추가해 주세요.');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cancelRequestedRef = useRef(false);

  const createBatchItemFromFile = (file: File): BatchItem => {
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    return {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      file,
      name: file.name,
      size: file.size,
      outputFileName: `${baseName}.mp3`,
      status: 'idle',
      progressPercentage: 0,
    };
  };

  const addFilesToList = async (incomingFiles: File[], notify = true) => {
    const wavFiles = incomingFiles.filter(
      (f) => f.name.toLowerCase().endsWith('.wav') || f.type === 'audio/wav'
    );

    if (wavFiles.length === 0) {
      setErrorMessage('선택된 파일 중 유효한 WAV (.wav) 파일이 없습니다.');
      return;
    }

    setErrorMessage(null);
    const newItems: BatchItem[] = wavFiles.map(createBatchItemFromFile);

    setFiles((prev) => {
      const combined = [...prev, ...newItems];
      if (!selectedPreviewId && combined.length > 0) {
        setSelectedPreviewId(combined[0].id);
      }
      return combined;
    });

    if (notify) {
      setStatusMessage(`${wavFiles.length}개의 WAV 파일이 추가되었습니다. (총 ${files.length + wavFiles.length}개)`);
    }

    // Background decode metadata (duration, samplerate) for added files
    for (const item of newItems) {
      try {
        const decoded = await decodeAudioFile(item.file);
        setFiles((prev) =>
          prev.map((f) =>
            f.id === item.id
              ? {
                  ...f,
                  duration: decoded.duration,
                  sampleRate: decoded.sampleRate,
                  channels: decoded.channels,
                  audioBuffer: decoded.audioBuffer,
                  objectUrl: decoded.objectUrl,
                }
              : f
          )
        );
      } catch (err) {
        console.warn('Metadata pre-decode skipped for:', item.name, err);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files) as File[];
      addFilesToList(selected, true);
      // Reset input value so same files can be re-added if desired
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const dropped = Array.from(e.dataTransfer.files) as File[];
      addFilesToList(dropped, true);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleLoadSample = () => {
    const sample = createSampleWav();
    addFilesToList([sample], true);
    setStatusMessage('테스트용 화음 샘플 WAV 파일이 추가되었습니다.');
  };

  const handleRemoveFile = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isConverting) return;
    setFiles((prev) => {
      const filtered = prev.filter((item) => item.id !== id);
      if (selectedPreviewId === id) {
        setSelectedPreviewId(filtered.length > 0 ? filtered[0].id : null);
      }
      return filtered;
    });
  };

  const handleClearAll = () => {
    if (isConverting) return;
    setFiles([]);
    setSelectedPreviewId(null);
    setStatusMessage('파일 목록이 초기화되었습니다.');
    setErrorMessage(null);
    setCurrentProgress({
      percentage: 0,
      currentChunk: 0,
      totalChunks: 0,
      elapsedSeconds: 0,
      estimatedRemainingSeconds: 0,
      conversionSpeed: 0,
    });
  };

  useEffect(() => {
    outputDirHandleRef.current = outputDirHandle;
  }, [outputDirHandle]);

  const handleFolderSelect = (newPath: string, dirHandle?: FileSystemDirectoryHandle | null) => {
    setOutputDir(newPath);
    if (dirHandle) {
      setOutputDirHandle(dirHandle);
      outputDirHandleRef.current = dirHandle;
      setStatusMessage(`저장 대상 폴더가 '${dirHandle.name}'(으)로 지정되었습니다. 변환 완료 시 해당 폴더에 파일이 자동 저장됩니다.`);
    } else {
      setOutputDirHandle(null);
      outputDirHandleRef.current = null;
      setStatusMessage(`저장 대상 경로가 '${newPath}'(으)로 설정되었습니다.`);
    }
  };

  // Execute batch conversion
  const handleStartConversion = async () => {
    if (files.length === 0) {
      setErrorMessage('변환할 WAV 파일을 먼저 추가해 주세요.');
      return;
    }

    const pendingItems = files.filter((f) => f.status !== 'completed');
    if (pendingItems.length === 0) {
      setStatusMessage('모든 파일이 이미 변환 완료되었습니다. 재변환하려면 목록을 초기화해 주세요.');
      return;
    }

    // If user has not yet connected a folder handle, prompt them so files save directly to that folder
    if (!outputDirHandleRef.current && 'showDirectoryPicker' in window) {
      try {
        const ask = confirm(
          `변환된 MP3 파일을 저장할 컴퓨터의 대상 폴더를 선택하시겠습니까?\n\n'확인'을 누르면 탐색기에서 원하는 저장 폴더를 선택할 수 있으며, 변환 완료 시 해당 폴더에 파일이 직접 저장됩니다.\n('취소'를 누르면 기존 설정대로 변환을 진행합니다)`
        );
        if (ask) {
          const dirHandle = await (window as unknown as {
            showDirectoryPicker: (opts?: { mode?: string }) => Promise<FileSystemDirectoryHandle>;
          }).showDirectoryPicker({ mode: 'readwrite' });
          if (dirHandle) {
            setOutputDir(dirHandle.name);
            setOutputDirHandle(dirHandle);
            outputDirHandleRef.current = dirHandle;
          }
        }
      } catch (err: unknown) {
        const error = err as { name?: string };
        if (error?.name !== 'AbortError') {
          console.warn('Directory picker prompt cancelled or error:', err);
        }
      }
    }

    setIsConverting(true);
    setErrorMessage(null);
    cancelRequestedRef.current = false;

    let completedCount = files.filter((f) => f.status === 'completed').length;
    const totalCount = files.length;

    for (let i = 0; i < files.length; i++) {
      if (cancelRequestedRef.current) {
        setStatusMessage('변환 작업이 사용자에 의해 중지되었습니다.');
        break;
      }

      const item = files[i];
      if (item.status === 'completed') {
        continue;
      }

      setCurrentFileIndex(i);
      setStatusMessage(`[${completedCount + 1}/${totalCount}] 디코딩 중: ${item.name}`);

      // Update status to decoding
      setFiles((prev) =>
        prev.map((f, idx) => (idx === i ? { ...f, status: 'decoding', progressPercentage: 0 } : f))
      );

      try {
        // Decode buffer if not already decoded
        let audioBuffer = item.audioBuffer;
        let objectUrl = item.objectUrl;

        if (!audioBuffer) {
          const decoded = await decodeAudioFile(item.file);
          audioBuffer = decoded.audioBuffer;
          objectUrl = decoded.objectUrl;
          setFiles((prev) =>
            prev.map((f, idx) =>
              idx === i
                ? {
                    ...f,
                    audioBuffer,
                    objectUrl,
                    duration: decoded.duration,
                    sampleRate: decoded.sampleRate,
                    channels: decoded.channels,
                  }
                : f
            )
          );
        }

        if (cancelRequestedRef.current) break;

        // Update status to converting
        setFiles((prev) =>
          prev.map((f, idx) => (idx === i ? { ...f, status: 'converting' } : f))
        );

        const result = await convertWavToMp3(
          audioBuffer,
          {
            mode,
            vbrQuality,
            cbrBitrate,
            outputFileName: item.outputFileName,
          },
          (prog) => {
            setCurrentProgress(prog);
            setFiles((prev) =>
              prev.map((f, idx) =>
                idx === i ? { ...f, progressPercentage: prog.percentage } : f
              )
            );
            setStatusMessage(
              `[${completedCount + 1}/${totalCount}] 변환 중: ${item.name} (${prog.percentage}%) [속도: ${prog.conversionSpeed}x]`
            );
          },
          () => cancelRequestedRef.current
        );

        // If target directory handle is active, write directly to user's specified folder!
        let savedDirectly = false;
        let savedPathStr = '';
        if (outputDirHandleRef.current) {
          try {
            const handle = outputDirHandleRef.current;
            const fileHandle = await handle.getFileHandle(item.outputFileName, { create: true });
            const writable = await (fileHandle as unknown as {
              createWritable: () => Promise<{
                write: (data: Blob) => Promise<void>;
                close: () => Promise<void>;
              }>;
            }).createWritable();
            await writable.write(result.blob);
            await writable.close();
            savedDirectly = true;
            savedPathStr = handle.name;
          } catch (writeErr) {
            console.error('Failed to write directly to target folder handle:', writeErr);
          }
        }

        completedCount++;
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i
              ? {
                  ...f,
                  status: 'completed',
                  progressPercentage: 100,
                  result,
                  savedToFolder: savedDirectly,
                  savedPath: savedPathStr,
                }
              : f
          )
        );

        if (savedDirectly) {
          setStatusMessage(
            `[${completedCount}/${totalCount}] 변환 및 '${savedPathStr}' 폴더 저장 완료: ${item.outputFileName}`
          );
        }
      } catch (err: unknown) {
        if (cancelRequestedRef.current) {
          break;
        }
        console.error('Conversion failed for', item.name, err);
        const errStr = err instanceof Error ? err.message : '변환 오류';
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, status: 'error', errorMessage: errStr } : f
          )
        );
      }
    }

    setIsConverting(false);
    setCurrentFileIndex(-1);

    if (!cancelRequestedRef.current) {
      if (outputDirHandleRef.current) {
        setStatusMessage(
          `모든 변환 작업 완료! 총 ${completedCount}개 파일이 지정 폴더('${outputDirHandleRef.current.name}')에 직접 저장되었습니다.`
        );
      } else {
        setStatusMessage(`모든 변환 작업 완료! (총 ${completedCount}개 파일 변환됨)`);
      }
    }
  };

  const handleCancelConversion = () => {
    cancelRequestedRef.current = true;
    setStatusMessage('변환 중지 요청됨...');
  };

  const handleDownloadSingle = async (item: BatchItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!item.result) return;

    // 1. If output directory handle is available, write directly to that folder
    if (outputDirHandleRef.current) {
      try {
        const fileHandle = await outputDirHandleRef.current.getFileHandle(item.outputFileName, { create: true });
        const writable = await (fileHandle as unknown as {
          createWritable: () => Promise<{
            write: (data: Blob) => Promise<void>;
            close: () => Promise<void>;
          }>;
        }).createWritable();
        await writable.write(item.result.blob);
        await writable.close();
        setStatusMessage(`'${item.outputFileName}' 파일이 지정 폴더('${outputDirHandleRef.current.name}')에 저장되었습니다.`);
        setFiles((prev) =>
          prev.map((f) =>
            f.id === item.id ? { ...f, savedToFolder: true, savedPath: outputDirHandleRef.current?.name } : f
          )
        );
        return;
      } catch (err) {
        console.error('Failed writing to dirHandle:', err);
      }
    }

    // 2. If showSaveFilePicker is available in browser, let user choose target folder directly:
    if ('showSaveFilePicker' in window) {
      try {
        const fileHandle = await (window as unknown as {
          showSaveFilePicker: (opts?: {
            suggestedName?: string;
            types?: Array<{ description: string; accept: Record<string, string[]> }>;
          }) => Promise<{
            createWritable: () => Promise<{
              write: (data: Blob) => Promise<void>;
              close: () => Promise<void>;
            }>;
          }>;
        }).showSaveFilePicker({
          suggestedName: item.outputFileName,
          types: [
            {
              description: 'MP3 오디오 파일 (*.mp3)',
              accept: { 'audio/mp3': ['.mp3'] },
            },
          ],
        });
        const writable = await fileHandle.createWritable();
        await writable.write(item.result.blob);
        await writable.close();
        setStatusMessage(`'${item.outputFileName}' 저장이 완료되었습니다.`);
        setFiles((prev) =>
          prev.map((f) => (f.id === item.id ? { ...f, savedToFolder: true } : f))
        );
        return;
      } catch (err: unknown) {
        const error = err as { name?: string };
        if (error?.name === 'AbortError') return; // User cancelled dialog
      }
    }

    // 3. Fallback: regular browser download
    const a = document.createElement('a');
    a.href = item.result.url;
    a.download = item.outputFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadAllZip = async () => {
    const completedItems = files.filter((f) => f.result);
    if (completedItems.length === 0) {
      setErrorMessage('다운로드할 변환 완료된 MP3 파일이 없습니다.');
      return;
    }

    setIsZipping(true);
    setStatusMessage('MP3 파일들을 ZIP 압축 파일로 패키징 중...');

    try {
      const zip = new JSZip();
      for (const item of completedItems) {
        if (item.result) {
          zip.file(item.outputFileName, item.result.blob);
        }
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `converted_mp3_files_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatusMessage(`ZIP 압축 파일 다운로드 완료! (${completedItems.length}개 파일 포함)`);
    } catch (err) {
      console.error(err);
      setErrorMessage('ZIP 파일 생성 중 오류가 발생했습니다.');
    } finally {
      setIsZipping(false);
    }
  };

  const handleResetApp = () => {
    if (files.length > 0 && !confirm('변환 목록을 초기화하시겠습니까?')) {
      return;
    }
    handleClearAll();
    setErrorMessage(null);
    setStatusMessage('준비 완료 - WAV 파일을 추가해 주세요.');
  };

  const completedCount = files.filter((f) => f.status === 'completed').length;
  const totalCount = files.length;
  const overallPercentage =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const selectedItem = files.find((f) => f.id === selectedPreviewId) || files[0] || null;

  return (
    <div
      id="web-app-viewport"
      className="min-h-screen bg-slate-100 text-slate-800 p-2 sm:p-5 md:p-8 flex flex-col items-center justify-start font-sans antialiased"
    >
      {/* Hidden Multiple File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".wav,audio/wav"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Main Web Card Container */}
      <div
        id="main-converter-card"
        className="w-full max-w-[840px] bg-[#f3f5f8] rounded-xl shadow-xl border border-slate-300 flex flex-col overflow-hidden"
      >
        {/* Top Header Bar */}
        <TitleBar
          onReset={handleResetApp}
          onShowInfo={() => setShowAboutModal(true)}
        />

        {/* Window Content / Central Widget */}
        <div className="flex-1 p-3.5 sm:p-5 space-y-3.5 bg-[#edf1f5] text-xs">
          {/* Header Branding & Quick Links */}
          <div
            id="company-header-bar"
            className="bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 shadow-2xs text-xs"
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block shadow-xs"></span>
              <span className="text-sm font-bold text-slate-900 tracking-tight">
                (주)니모뮤직
              </span>
            </div>
            <div className="flex items-center gap-3 text-slate-600 text-[11px] sm:text-xs">
              <a
                id="link-dev-homepage"
                href="https://www.plymaster.co.kr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-700 hover:text-blue-900 hover:underline font-medium flex items-center gap-1 transition-colors"
              >
                <Globe className="w-3.5 h-3.5 text-blue-600" />
                <span>개발자 홈페이지</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
              <span className="text-slate-300">|</span>
              <a
                id="link-streaming-site"
                href="https://www.plymaster.co.kr/?view=pop"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-700 hover:text-indigo-900 hover:underline font-medium flex items-center gap-1 transition-colors"
              >
                <Headphones className="w-3.5 h-3.5 text-indigo-600" />
                <span>무료 스트리밍 사이트</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="bg-red-100 border border-red-300 text-red-800 px-3 py-2 rounded flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span className="flex-1">{errorMessage}</span>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-red-600 hover:text-red-800 font-bold px-1"
              >
                ✕
              </button>
            </div>
          )}

          {/* 1. QGroupBox: 입력 WAV 파일 목록 (다중 선택 지원) */}
          <div
            id="groupbox-input-file"
            className="bg-white border border-slate-300 rounded shadow-2xs relative pt-4 p-3"
          >
            <div className="absolute -top-2.5 left-3 bg-white px-2 font-bold text-blue-700 flex items-center gap-1.5 border border-slate-200/80 rounded-xs shadow-2xs">
              <FileAudio className="w-3.5 h-3.5 text-blue-600" />
              <span>1. 입력 WAV 파일 선택 (다중 파일 지원)</span>
            </div>

            {/* Drag & Drop Area */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`border-2 border-dashed rounded p-3 text-center transition-colors mb-2.5 ${
                isDragging
                  ? 'border-blue-500 bg-blue-50/70'
                  : 'border-slate-300 hover:border-slate-400 bg-slate-50/70'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 text-left w-full sm:w-auto">
                  <div className="w-9 h-9 rounded bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0">
                    <Disc3 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <span>WAV 파일을 여러 개 드래그하거나 선택하세요</span>
                      <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-mono font-medium">
                        총 {files.length}개 파일
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Ctrl 또는 Shift를 누른 채 여러 WAV 파일을 한 번에 선택할 수 있습니다.
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
                  <button
                    id="btn-browse-wav"
                    type="button"
                    disabled={isConverting}
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-[#f0f4f8] hover:bg-slate-200 disabled:opacity-50 text-slate-800 border border-slate-300 rounded font-medium flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-slate-600" />
                    <span>WAV 파일 추가...</span>
                  </button>

                  {files.length > 0 && (
                    <button
                      id="btn-clear-list"
                      type="button"
                      disabled={isConverting}
                      onClick={handleClearAll}
                      className="px-2 py-1.5 bg-slate-100 hover:bg-red-50 disabled:opacity-50 text-slate-600 hover:text-red-700 border border-slate-300 rounded transition-colors shadow-2xs cursor-pointer"
                      title="목록 비우기"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Batch Files List Table */}
            {files.length > 0 ? (
              <div className="border border-slate-200 rounded overflow-hidden">
                <div className="max-h-44 overflow-y-auto divide-y divide-slate-200 bg-white">
                  {files.map((item, index) => {
                    const isSelected = item.id === selectedPreviewId;
                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedPreviewId(item.id)}
                        className={`p-2 flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                          isSelected ? 'bg-blue-50/80' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="w-5 text-[11px] font-mono text-slate-400 text-right shrink-0">
                            {index + 1}.
                          </span>
                          <FileAudio className="w-4 h-4 text-blue-600 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-slate-800 text-[11px] truncate flex items-center gap-1.5">
                              <span className="truncate">{item.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                ({formatBytes(item.size)})
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 truncate font-mono">
                              {item.duration
                                ? `${formatDuration(item.duration)} • ${item.sampleRate?.toLocaleString()}Hz • ${
                                    item.channels === 1 ? '모노' : '스테레오'
                                  }`
                                : '대기 중...'}
                            </div>
                          </div>
                        </div>

                        {/* Status badge & Individual Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          {item.status === 'idle' && (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 border border-slate-200 font-medium">
                              대기 중
                            </span>
                          )}
                          {item.status === 'decoding' && (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-blue-100 text-blue-700 border border-blue-200 font-medium flex items-center gap-1">
                              <Disc3 className="w-3 h-3 animate-spin" />
                              디코딩 중
                            </span>
                          )}
                          {item.status === 'converting' && (
                            <div className="flex items-center gap-1.5">
                              <div className="w-16 bg-slate-200 rounded-full h-2 overflow-hidden">
                                <div
                                  className="bg-blue-600 h-full rounded-full transition-all duration-100"
                                  style={{ width: `${item.progressPercentage}%` }}
                                ></div>
                              </div>
                              <span className="text-[10px] font-mono font-bold text-blue-700">
                                {item.progressPercentage}%
                              </span>
                            </div>
                          )}
                          {item.status === 'completed' && (
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 font-medium flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                {item.savedToFolder ? '저장 완료' : '완료'} ({formatBytes(item.result?.size || 0)})
                              </span>
                              <button
                                type="button"
                                onClick={(e) => handleDownloadSingle(item, e)}
                                className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-medium flex items-center gap-1 shadow-2xs cursor-pointer"
                                title={item.savedToFolder ? '지정 폴더에 다시 저장' : 'MP3 저장'}
                              >
                                <Download className="w-2.5 h-2.5" />
                                <span>저장</span>
                              </button>
                            </div>
                          )}
                          {item.status === 'error' && (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-red-100 text-red-700 border border-red-200 font-medium">
                              오류
                            </span>
                          )}

                          {/* Delete row */}
                          {!isConverting && (
                            <button
                              type="button"
                              onClick={(e) => handleRemoveFile(item.id, e)}
                              className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                              title="항목 제거"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded text-center text-slate-500 text-[11px]">
                추가된 WAV 파일이 없습니다. 상단의 'WAV 파일 추가...' 버튼을 눌러 WAV 파일을 추가해 주세요.
              </div>
            )}

            {/* Audio Preview for selected item */}
            {selectedItem && (selectedItem.objectUrl || selectedItem.result?.url) && (
              <div className="mt-2.5">
                <AudioPlayerWidget
                  title={`선택 오디오 미리듣기: ${selectedItem.name}`}
                  url={selectedItem.result?.url || selectedItem.objectUrl || ''}
                  badgeText={selectedItem.result ? '변환된 MP3' : 'WAV 원본'}
                  badgeColor={selectedItem.result ? 'emerald' : 'blue'}
                />
              </div>
            )}
          </div>

          {/* 2. QGroupBox: 인코딩 옵션 (VBR / CBR) */}
          <div
            id="groupbox-encoding-options"
            className="bg-white border border-slate-300 rounded shadow-2xs relative pt-4 p-3"
          >
            <div className="absolute -top-2.5 left-3 bg-white px-2 font-bold text-blue-700 flex items-center gap-1.5 border border-slate-200/80 rounded-xs shadow-2xs">
              <Sliders className="w-3.5 h-3.5 text-blue-600" />
              <span>2. 인코딩 설정 (VBR / CBR 옵션)</span>
            </div>

            {/* Mode Switcher */}
            <div className="flex items-center gap-6 pb-2.5 border-b border-slate-100">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  id="radio-vbr"
                  type="radio"
                  name="encodingMode"
                  checked={mode === 'VBR'}
                  onChange={() => setMode('VBR')}
                  className="w-3.5 h-3.5 text-blue-600 accent-blue-600 cursor-pointer"
                />
                <span className="font-semibold text-slate-800 group-hover:text-blue-700">
                  VBR (가변 비트레이트 - Variable Bitrate)
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1 py-0.5 rounded font-medium">
                  권장
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  id="radio-cbr"
                  type="radio"
                  name="encodingMode"
                  checked={mode === 'CBR'}
                  onChange={() => setMode('CBR')}
                  className="w-3.5 h-3.5 text-blue-600 accent-blue-600 cursor-pointer"
                />
                <span className="font-semibold text-slate-800 group-hover:text-blue-700">
                  CBR (고정 비트레이트 - Constant Bitrate)
                </span>
              </label>
            </div>

            {/* VBR Controls */}
            {mode === 'VBR' ? (
              <div id="vbr-controls-panel" className="pt-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-slate-700 flex items-center gap-1.5">
                    <span>품질 레벨 설정 (VBR Quality Slider):</span>
                    <span className="text-slate-400 text-[11px]">(0: 최고품질 ~ 9: 최소용량)</span>
                  </div>
                  <div className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-800 font-semibold font-mono text-[11px]">
                    {VBR_QUALITY_INFO[vbrQuality].label}
                  </div>
                </div>

                <div className="space-y-1">
                  <input
                    id="slider-vbr-quality"
                    type="range"
                    min={0}
                    max={9}
                    step={1}
                    value={vbrQuality}
                    onChange={(e) => setVbrQuality(parseInt(e.target.value) as VbrQuality)}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono px-1">
                    <span>V0 (최고)</span>
                    <span>V2 (권장)</span>
                    <span>V4 (보통)</span>
                    <span>V6 (경제)</span>
                    <span>V9 (최소)</span>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded p-2 text-[11px] text-slate-600 flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-800">
                      {VBR_QUALITY_INFO[vbrQuality].label}:
                    </span>{' '}
                    {VBR_QUALITY_INFO[vbrQuality].description}
                  </div>
                </div>
              </div>
            ) : (
              /* CBR Controls */
              <div id="cbr-controls-panel" className="pt-3 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label htmlFor="select-cbr-bitrate" className="font-medium text-slate-700">
                    고정 비트레이트 선택 (QComboBox):
                  </label>
                  <select
                    id="select-cbr-bitrate"
                    value={cbrBitrate}
                    onChange={(e) => setCbrBitrate(parseInt(e.target.value) as CbrBitrate)}
                    className="bg-white border border-slate-300 rounded px-3 py-1.5 font-medium text-slate-800 focus:outline-blue-600 shadow-2xs"
                  >
                    <option value={320}>320 kbps (스튜디오 최고 품질)</option>
                    <option value={256}>256 kbps (고품질 음원)</option>
                    <option value={192}>192 kbps (권장 CD 음질 - 기본)</option>
                    <option value={160}>160 kbps (준표준)</option>
                    <option value={128}>128 kbps (인터넷 라디오 표준)</option>
                    <option value={96}>96 kbps (음성 및 강의)</option>
                    <option value={64}>64 kbps (경량 음성)</option>
                  </select>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded p-2 text-[11px] text-slate-600 flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-800">
                      {CBR_BITRATE_INFO[cbrBitrate].label}:
                    </span>{' '}
                    {CBR_BITRATE_INFO[cbrBitrate].description}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3. QGroupBox: 저장 경로 및 일괄 저장 설정 */}
          <div
            id="groupbox-output-settings"
            className="bg-white border border-slate-300 rounded shadow-2xs relative pt-4 p-3"
          >
            <div className="absolute -top-2.5 left-3 bg-white px-2 font-bold text-blue-700 flex items-center gap-1.5 border border-slate-200/80 rounded-xs shadow-2xs">
              <FolderOpen className="w-3.5 h-3.5 text-blue-600" />
              <span>3. 저장 경로 및 출력 설정 (Output Settings)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  저장 대상 폴더:
                </label>
                <div className="flex gap-1.5">
                  <input
                    id="input-output-dir"
                    type="text"
                    value={outputDir}
                    onChange={(e) => setOutputDir(e.target.value)}
                    className="w-full bg-[#f8fafc] border border-slate-300 rounded px-2.5 py-1 text-slate-800 font-mono text-[11px] focus:bg-white focus:outline-blue-500"
                  />
                  <button
                    id="btn-select-dir"
                    type="button"
                    onClick={() => setShowFolderModal(true)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded text-slate-700 font-medium whitespace-nowrap shadow-2xs cursor-pointer"
                  >
                    경로 선택...
                  </button>
                </div>
                {outputDirHandle ? (
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium mt-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>지정 폴더 직접 저장 활성화됨 ('{outputDirHandle.name}')</span>
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-500 mt-1">
                    * '경로 선택...'을 눌러 컴퓨터 폴더를 선택하면 변환 완료 시 해당 폴더로 직접 저장됩니다.
                  </div>
                )}
              </div>

              <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-200">
                <div className="font-semibold text-slate-700 mb-0.5">파일 일괄 저장 규칙</div>
                <div>각 파일은 원래 파일명 그대로 <span className="font-mono font-medium text-blue-700">[파일명].mp3</span>로 변환 저장됩니다.</div>
              </div>
            </div>
          </div>

          {/* 4. QGroupBox: 변환 진행 상태 및 진행률 바 */}
          <div
            id="groupbox-conversion-progress"
            className="bg-white border border-slate-300 rounded shadow-2xs relative pt-4 p-3"
          >
            <div className="absolute -top-2.5 left-3 bg-white px-2 font-bold text-blue-700 flex items-center gap-1.5 border border-slate-200/80 rounded-xs shadow-2xs">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>4. 변환 진행 상태 (QProgressBar)</span>
            </div>

            <div className="space-y-3">
              {/* Overall Batch Progress */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-700">전체 일괄 진행률:</span>
                  <span className="font-mono font-bold text-blue-700">
                    {completedCount} / {totalCount} 파일 ({overallPercentage}%)
                  </span>
                </div>
                <div className="w-full bg-slate-200 border border-slate-300 rounded h-4 overflow-hidden relative shadow-inner">
                  <div
                    className="h-full bg-blue-600 transition-all duration-200"
                    style={{ width: `${overallPercentage}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-semibold text-slate-700 drop-shadow-xs pointer-events-none">
                    {totalCount > 0 ? `${completedCount} / ${totalCount} 완료 (${overallPercentage}%)` : '대기 중'}
                  </div>
                </div>
              </div>

              {/* Current File Progress */}
              {isConverting && currentFileIndex >= 0 && (
                <div className="space-y-1 pt-1 border-t border-slate-100">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-medium text-slate-600 truncate max-w-[280px]">
                      현재 파일 인코딩 중: {files[currentFileIndex]?.name}
                    </span>
                    <span className="font-mono font-bold text-indigo-700">
                      {currentProgress.percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 border border-slate-300 rounded h-4 overflow-hidden relative shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all duration-100 animate-pulse"
                      style={{ width: `${currentProgress.percentage}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-semibold text-white drop-shadow-xs pointer-events-none">
                      {currentProgress.percentage}% ({currentProgress.currentChunk} / {currentProgress.totalChunks} 블록)
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-500 font-mono pt-0.5">
                    <div>경과 시간: {currentProgress.elapsedSeconds.toFixed(1)}초</div>
                    <div>예상 남은 시간: {currentProgress.estimatedRemainingSeconds.toFixed(1)}초</div>
                    <div>변환 속도: {currentProgress.conversionSpeed > 0 ? `${currentProgress.conversionSpeed}x` : '-'}</div>
                  </div>
                </div>
              )}

              {/* Batch Complete Action Bar */}
              {completedCount > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-emerald-800 font-medium text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      {outputDirHandle
                        ? `총 ${completedCount}개 파일이 지정 폴더('${outputDirHandle.name}')에 직접 저장되었습니다!`
                        : `${completedCount}개 파일 변환 완료! 개별 다운로드하거나 ZIP으로 한 번에 받으세요.`}
                    </span>
                  </div>

                  <button
                    id="btn-download-all-zip"
                    type="button"
                    disabled={isZipping}
                    onClick={handleDownloadAllZip}
                    className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                  >
                    <Archive className="w-4 h-4" />
                    <span>{isZipping ? 'ZIP 압축 생성 중...' : `모든 MP3를 ZIP으로 다운로드 (${completedCount}개)`}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Action PushButtons */}
          <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
            <button
              id="btn-start-convert"
              type="button"
              disabled={isConverting || files.length === 0}
              onClick={handleStartConversion}
              className={`flex-1 w-full py-2.5 px-4 rounded font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer ${
                isConverting || files.length === 0
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed border border-slate-300'
                  : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white border border-blue-700 shadow-blue-900/10'
              }`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>
                {isConverting
                  ? `일괄 변환 진행 중... (${completedCount}/${totalCount})`
                  : `WAV → MP3 일괄 변환 시작 (${files.length}개 파일)`}
              </span>
            </button>

            {isConverting ? (
              <button
                id="btn-cancel-convert"
                type="button"
                onClick={handleCancelConversion}
                className="w-full sm:w-28 py-2.5 px-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <StopCircle className="w-3.5 h-3.5" />
                <span>중지</span>
              </button>
            ) : (
              <button
                id="btn-reset-form"
                type="button"
                onClick={handleClearAll}
                className="w-full sm:w-24 py-2.5 px-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded text-xs flex items-center justify-center gap-1 border border-slate-300 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>초기화</span>
              </button>
            )}
          </div>
        </div>

        {/* QStatusBar: Bottom Status Bar - Clean, without "PyQt6 Fusion Style" */}
        <div
          id="pyqt-statusbar"
          className="bg-[#e4e9ef] border-t border-[#cbd5e1] text-[11px] text-slate-600 px-3 py-1 flex items-center justify-between font-sans select-none"
        >
          <div className="flex items-center gap-1.5 truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
            <span className="truncate">{statusMessage}</span>
          </div>
        </div>
      </div>

      {/* Web Footer */}
      <footer className="mt-4 pb-4 text-center text-[11px] text-slate-500 max-w-xl">
        <p>© (주)니모뮤직 PLYMASTER. All rights reserved. • 브라우저 100% 로컬 변환 (오디오 파일 외부 서버 전송 없음)</p>
      </footer>

      {/* Folder Picker Modal */}
      <FolderDialogModal
        isOpen={showFolderModal}
        currentPath={outputDir}
        currentDirHandle={outputDirHandle}
        onSelect={handleFolderSelect}
        onClose={() => setShowFolderModal(false)}
      />

      {/* About Modal - Clean, without Python source code text */}
      {showAboutModal && (
        <div className="fixed inset-0 bg-black/45 z-50 flex items-center justify-center p-4">
          <div className="bg-white text-slate-800 w-full max-w-sm rounded shadow-2xl border border-slate-300 p-4 text-xs">
            <div className="flex items-center gap-2 mb-2 font-bold text-sm text-blue-700">
              <Music className="w-4 h-4" />
              <span>WAV to MP3 Converter 정보</span>
            </div>
            <p className="text-slate-600 leading-relaxed mb-3">
              이 애플리케이션은 순수 클라이언트 Web Audio API 및 LAME MP3 인코더를 통해
              여러 개의 무손실 WAV 파일을 고품질 MP3로 즉시 일괄 변환합니다.
            </p>
            <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-[11px] text-slate-600 space-y-1 mb-4">
              <div>• 다중 파일 일괄 변환 및 ZIP 압축 일괄 다운로드</div>
              <div>• VBR: LAME V0~V9 가변 비트레이트 품질 슬라이더</div>
              <div>• CBR: 64~320 kbps 고정 비트레이트 선택</div>
              <div>• 실시간 진행률(QProgressBar) & 경과/예상 시간</div>
              <div>• 원본 및 변환 오디오 내장 플레이어 미리듣기</div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowAboutModal(false)}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium cursor-pointer"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
