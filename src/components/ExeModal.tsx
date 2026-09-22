import React, { useState } from 'react';
import {
  Download,
  Terminal,
  CheckCircle2,
  FolderArchive,
  Copy,
  Check,
  X,
  Laptop,
  FileCode,
  Sparkles,
  Zap,
} from 'lucide-react';
import {
  downloadSingleHtmlFile,
  downloadWindowsExePackage,
  downloadExeFile,
  PYTHON_DESKTOP_CODE,
  BUILD_BAT_CONTENT,
} from '../utils/exePackageGenerator';

interface ExeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExeModal: React.FC<ExeModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'guide' | 'py' | 'bat'>('guide');
  const [copied, setCopied] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [isDownloadingHtml, setIsDownloadingHtml] = useState(false);
  const [isDownloadingExe, setIsDownloadingExe] = useState(false);

  if (!isOpen) return null;

  const handleDownloadExe = async () => {
    setIsDownloadingExe(true);
    try {
      await downloadExeFile();
    } catch (e) {
      console.error(e);
    } finally {
      setIsDownloadingExe(false);
    }
  };

  const handleDownloadHtml = async () => {
    setIsDownloadingHtml(true);
    try {
      await downloadSingleHtmlFile();
    } finally {
      setIsDownloadingHtml(false);
    }
  };

  const handleDownloadZip = async () => {
    setIsDownloadingZip(true);
    try {
      await downloadWindowsExePackage();
    } catch (e) {
      console.error(e);
    } finally {
      setIsDownloadingZip(false);
    }
  };

  const handleCopyCmd = () => {
    const cmd = 'python -m pip install pywebview pyinstaller && python -m PyInstaller --onefile --windowed --add-data "WavToMp3Converter.html;." --name "WavToMp3Converter" main.py';
    navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs">
      <div className="bg-white text-slate-800 w-full max-w-2xl rounded-lg shadow-2xl border border-slate-300 flex flex-col max-h-[92vh] overflow-hidden text-xs">
        {/* Header */}
        <div className="bg-[#243342] text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Laptop className="w-4 h-4 text-blue-400" />
            <span className="font-bold text-sm tracking-tight">
              WAV to MP3 Converter - 100% 동일 화면 배포 &amp; .exe 생성
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded hover:bg-slate-700/50 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 pt-2 flex gap-2">
          <button
            onClick={() => setActiveTab('guide')}
            className={`px-3 py-1.5 font-semibold text-xs border-b-2 transition-colors cursor-pointer ${
              activeTab === 'guide'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            배포 방법 안내 (단일 파일 / 데스크톱 앱)
          </button>
          <button
            onClick={() => setActiveTab('py')}
            className={`px-3 py-1.5 font-semibold text-xs border-b-2 transition-colors cursor-pointer ${
              activeTab === 'py'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Python 앱 소스 (main.py)
          </button>
          <button
            onClick={() => setActiveTab('bat')}
            className={`px-3 py-1.5 font-semibold text-xs border-b-2 transition-colors cursor-pointer ${
              activeTab === 'bat'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            원클릭 .exe 빌더 (build_exe.bat)
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'guide' && (
            <div className="space-y-4">
              {/* Troubleshooting Alert Box: Antivirus / Virus False Positive Notice */}
              <div className="bg-rose-50 border-2 border-rose-300 rounded-lg p-3.5 text-rose-950 shadow-xs">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    !
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <div className="font-bold text-xs text-rose-950 flex items-center justify-between">
                      <span>"바이러스가 발견됨" 또는 "다운로드 차단" 오류가 발생했나요?</span>
                      <span className="text-[10px] bg-rose-200 text-rose-900 px-1.5 py-0.5 rounded font-semibold">보안 오탐지(False Positive) 안내</span>
                    </div>
                    <p className="text-[11px] text-rose-900 leading-relaxed">
                      Windows Defender 및 브라우저(Chrome/Edge)는 인터넷에서 다운로드되는 모든 <strong>미서명 .exe(수백만 원의 유료 상용 코드사인 인증서가 없는 오픈소스/개인 실행 파일)</strong>를 휴리스틱 보안 필터에 의해 '알 수 없는 위험 파일/바이러스'로 자동 분류하여 차단합니다.
                    </p>
                    <div className="bg-white/80 rounded border border-rose-200 p-2 text-[11px] text-slate-800 space-y-1">
                      <div className="font-bold text-rose-900">💡 100% 안전하게 다운로드 및 실행하는 3가지 방법:</div>
                      <ul className="list-disc list-inside space-y-0.5 pl-1 text-[11px] text-slate-700">
                        <li><strong>해결 1 (추천):</strong> 아래 <span className="text-blue-700 font-bold">[Windows 안전 패키지 (.zip)]</span> 다운로드 (인터넷 바이너리를 배제하여 <strong>백신 차단 0%</strong>! 압축 해제 후 <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold text-blue-900">변환기_앱창으로_실행.bat</code> 더블클릭)</li>
                        <li><strong>해결 2 (무설치):</strong> 아래 <span className="text-emerald-700 font-bold">[단일 HTML 배포 파일 (.html)]</span> 다운로드 (백신 차단이 원천적으로 불가능한 순수 웹 파일로, 더블클릭 시 오프라인에서 즉시 실행)</li>
                        <li><strong>해결 3 (브라우저 차단 해제):</strong> 브라우저 다운로드 창(<kbd className="bg-slate-200 px-1 rounded font-mono">Ctrl+J</kbd>)에서 [차단된 파일] 우측의 <strong>[보관] &gt; [계속 다운로드]</strong>를 누르면 즉시 다운로드 완료</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 1: Windows Safe Desktop Package (.zip) (MOST RECOMMENDED) */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-400 rounded-lg p-4 shadow-xs">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 bg-blue-600 text-white rounded text-[10px] font-bold flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> 추천 1 (백신 차단 0% 안전 패키지)
                      </span>
                      <span className="font-bold text-slate-900 text-sm">
                        Windows 안전 실행 패키지 다운로드 (.zip)
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px] mt-1 leading-relaxed">
                      인터넷 미서명 바이너리를 배제하여 <strong>Windows Defender 및 모든 백신에서 바이러스 오탐지 없이 100% 정상 다운로드</strong>됩니다. 압축을 풀고 배치 파일을 더블클릭하면 끝납니다!
                    </p>
                  </div>
                </div>

                <div className="bg-white/90 rounded border border-blue-200 p-2.5 space-y-1.5 text-[11px] text-slate-700 mb-3">
                  <div className="flex items-center gap-1.5 font-semibold text-blue-900">
                    <Zap className="w-3.5 h-3.5 text-blue-600" />
                    <span>ZIP 압축 해제 후 제공되는 원클릭 도구들:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 pl-1 text-slate-600">
                    <li><strong className="text-blue-900">변환기_앱창으로_실행.bat</strong>: 더블클릭 시 주소창/탭 없는 윈도우 독립 앱 창으로 100% 동일하게 0초 만에 즉시 실행</li>
                    <li><strong className="text-emerald-800">바탕화면_바로가기_생성.bat</strong>: 더블클릭 시 Windows 바탕화면에 [WAV to MP3 변환기] 바로가기 아이콘 자동 생성</li>
                    <li><strong className="text-indigo-800">exe_실행파일_직접만들기.bat</strong>: Windows 내장 공식 컴파일러를 통해 내 PC 전용 안전한 <code className="font-mono">WavToMp3Converter.exe</code>를 1초 만에 직접 빌드 (외부 다운로드가 아니므로 백신 경고 0%)</li>
                    <li><strong className="text-teal-800">WavToMp3Converter.html</strong>: 더블클릭 시 어떤 PC 브라우저에서든 오프라인 즉시 실행</li>
                    <li><strong className="text-slate-700">사용안내_README.txt</strong>: 상세 실행 및 트러블슈팅 가이드</li>
                  </ul>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-blue-200">
                  <div className="text-[11px] text-blue-800 font-medium">
                    Windows 10 / 11 완벽 호환 • 백신 바이러스 오탐지 0% 보장
                  </div>
                  <button
                    onClick={handleDownloadZip}
                    disabled={isDownloadingZip}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md flex items-center justify-center gap-2 shadow transition-all cursor-pointer whitespace-nowrap active:scale-98"
                  >
                    <Download className="w-4 h-4" />
                    <span>{isDownloadingZip ? 'ZIP 패키지 준비 중...' : '안전 패키지 받기 (.zip)'}</span>
                  </button>
                </div>
              </div>

              {/* Card 2: Single HTML file distribution */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-400 rounded-lg p-3.5 shadow-xs">
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-bold">
                        추천 2 (초간단 단일 파일)
                      </span>
                      <span className="font-bold text-slate-900 text-xs">
                        단일 HTML 배포 파일 받기 (설치/빌드 0초)
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px] mt-1 leading-relaxed">
                      별도 설치나 압축 풀기 전혀 없이 <strong>WavToMp3Converter.html</strong> 파일 하나만 더블클릭하면 <strong>현재 화면과 100% 동일하게</strong> 오프라인에서도 모든 변환 기능이 완벽하게 실행됩니다. 백신 차단이 발생하지 않습니다!
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-emerald-200">
                  <div className="text-[11px] text-emerald-800 font-medium">
                    Edge, Chrome, Whale 등 모든 PC 브라우저에서 더블클릭 즉시 실행
                  </div>
                  <button
                    onClick={handleDownloadHtml}
                    disabled={isDownloadingHtml}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-md flex items-center justify-center gap-1.5 shadow transition-all cursor-pointer whitespace-nowrap active:scale-98"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isDownloadingHtml ? '파일 준비 중...' : 'WavToMp3Converter.html 다운로드'}</span>
                  </button>
                </div>
              </div>

              {/* Card 3: Direct EXE download */}
              <div className="bg-slate-50 border border-slate-300 rounded-lg p-3.5 shadow-xs">
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 bg-slate-700 text-white rounded text-[10px] font-bold">
                        선택 3
                      </span>
                      <span className="font-bold text-slate-900 text-xs">
                        단일 실행 파일 (.exe) 직접 받기
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px] mt-1 leading-relaxed">
                      Windows 전용 네이티브 실행기 파일(<code className="font-mono">WavToMp3Converter.exe</code>)입니다. 브라우저나 윈도우 디펜더에서 미서명 경고가 뜰 경우, 다운로드 항목(<kbd className="bg-slate-200 px-1 rounded">Ctrl+J</kbd>)에서 <strong>[보관] &gt; [계속 다운로드]</strong>를 클릭하세요.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200">
                  <div className="text-[10px] text-slate-500">
                    * 브라우저 보안 경고 발생 시: [더보기] &gt; [유지] 또는 [추가 정보] &gt; [실행] 클릭
                  </div>
                  <button
                    onClick={handleDownloadExe}
                    disabled={isDownloadingExe}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-md flex items-center justify-center gap-1.5 shadow transition-all cursor-pointer whitespace-nowrap active:scale-98"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isDownloadingExe ? '다운로드 준비 중...' : 'WavToMp3Converter.exe 받기'}</span>
                  </button>
                </div>
              </div>

              {/* Step by step guide */}
              <div className="border border-slate-200 rounded-lg p-3 bg-white space-y-3">
                <div className="font-bold text-slate-800 text-xs flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>다운로드 후 실행하는 초간단 순서</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="bg-slate-50 border border-slate-200 rounded p-2.5 text-slate-700">
                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[10px] mb-1.5">
                      A
                    </div>
                    <div className="font-bold text-slate-800 mb-1">단일 HTML 배포</div>
                    <p className="text-[11px] text-slate-500">
                      <code className="text-emerald-700 font-semibold font-mono">WavToMp3Converter.html</code>을 더블클릭하면 즉시 동일한 화면으로 실행됩니다.
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded p-2.5 text-slate-700">
                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px] mb-1.5">
                      B
                    </div>
                    <div className="font-bold text-slate-800 mb-1">독립 앱 창 실행</div>
                    <p className="text-[11px] text-slate-500">
                      ZIP 압축 해제 후 <code className="text-blue-700 font-semibold font-mono">run_desktop_app.bat</code>을 더블클릭하면 주소창 없는 독립 창으로 실행됩니다.
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded p-2.5 text-slate-700">
                    <div className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px] mb-1.5">
                      C
                    </div>
                    <div className="font-bold text-slate-800 mb-1">단일 .exe 빌드</div>
                    <p className="text-[11px] text-slate-500">
                      <code className="text-indigo-700 font-semibold font-mono">build_exe.bat</code>을 더블클릭하면 1분 후 <code className="text-indigo-700 font-mono">dist/WavToMp3Converter.exe</code>가 생성됩니다.
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick CLI command */}
              <div className="bg-slate-900 text-slate-200 rounded-lg p-3 font-mono text-[11px]">
                <div className="flex items-center justify-between text-slate-400 mb-1.5 text-[10px]">
                  <span className="flex items-center gap-1 font-sans">
                    <Terminal className="w-3.5 h-3.5" />
                    <span>CMD/터미널에서 직접 빌드하는 명령어</span>
                  </span>
                  <button
                    onClick={handleCopyCmd}
                    className="flex items-center gap-1 px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? '복사 완료' : '명령어 복사'}</span>
                  </button>
                </div>
                <div className="bg-slate-950 p-2 rounded border border-slate-800 overflow-x-auto text-emerald-400">
                  python -m pip install pywebview pyinstaller &amp;&amp; python -m PyInstaller --onefile --windowed --add-data "WavToMp3Converter.html;." --name "WavToMp3Converter" main.py
                </div>
              </div>
            </div>
          )}

          {activeTab === 'py' && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-slate-600">
                <span>main.py (웹 화면과 100% 동일한 WebView2 데스크톱 래퍼)</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(PYTHON_DESKTOP_CODE);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 flex items-center gap-1 border border-slate-300 cursor-pointer"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>전체 코드 복사</span>
                </button>
              </div>
              <pre className="bg-slate-900 text-slate-100 p-3 rounded font-mono text-[11px] max-h-80 overflow-y-auto border border-slate-800 leading-relaxed">
                {PYTHON_DESKTOP_CODE}
              </pre>
            </div>
          )}

          {activeTab === 'bat' && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-slate-600">
                <span>build_exe.bat (원클릭 PyInstaller 빌드 자동화 스크립트)</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(BUILD_BAT_CONTENT);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 flex items-center gap-1 border border-slate-300 cursor-pointer"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>배치 스크립트 복사</span>
                </button>
              </div>
              <pre className="bg-slate-900 text-slate-100 p-3 rounded font-mono text-[11px] max-h-80 overflow-y-auto border border-slate-800 leading-relaxed">
                {BUILD_BAT_CONTENT}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-100 border-t border-slate-200 px-4 py-2.5 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            제작: (주)니모뮤직 • <a href="https://www.plymaster.co.kr" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">www.plymaster.co.kr</a>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDownloadHtml}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>단일 HTML 받기</span>
            </button>
            <button
              onClick={handleDownloadZip}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ZIP 패키지 받기</span>
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded cursor-pointer"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
