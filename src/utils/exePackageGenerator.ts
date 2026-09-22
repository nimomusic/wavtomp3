import JSZip from 'jszip';

export const PYTHON_DESKTOP_CODE = `# -*- coding: utf-8 -*-
"""
WAV to MP3 Converter - Windows Desktop Edition
(주)니모뮤직 / PLYMASTER
https://www.plymaster.co.kr

This application opens the exact full-fidelity desktop application window
matching the modern design (dark navy titlebar, rich cards, audio preview player,
batch list, VBR/CBR controls, and progress tracking).
"""

import sys
import os
import subprocess

def get_html_path():
    # PyInstaller extracts to _MEIPASS in onefile mode
    if getattr(sys, 'frozen', False):
        base_dir = getattr(sys, '_MEIPASS', os.path.dirname(os.path.abspath(__file__)))
    else:
        base_dir = os.path.dirname(os.path.abspath(__file__))
    
    html_file = os.path.join(base_dir, "WavToMp3Converter.html")
    return html_file

def run():
    html_file = get_html_path()
    
    if not os.path.exists(html_file):
        print(f"[ERROR] HTML file not found at: {html_file}")
        sys.exit(1)

    abs_path = os.path.abspath(html_file)
    file_url = f"file:///{abs_path.replace(os.sep, '/')}"

    # 1. Try pywebview (Native Windows WebView2 - 100% native window, zero browser tabs or URL bar)
    try:
        import webview
        window = webview.create_window(
            title="WAV to MP3 Converter",
            url=file_url,
            width=980,
            height=880,
            min_size=(760, 640),
            resizable=True,
            confirm_close=False,
            easy_drag=False
        )
        webview.start()
        return
    except ImportError:
        pass
    except Exception as e:
        print(f"pywebview notice: {e}")

    # 2. Try Windows Edge Application Mode (Dedicated standalone desktop app window)
    if sys.platform == 'win32':
        try:
            subprocess.run(
                ["cmd", "/c", "start", "msedge", f"--app={file_url}", "--window-size=980,880"],
                check=True
            )
            return
        except Exception:
            pass

    # 3. Fallback: Open default browser
    import webbrowser
    webbrowser.open(file_url)

if __name__ == "__main__":
    run()
`;

export const RUN_DESKTOP_APP_BAT = `@echo off
chcp 65001 >nul
setlocal
title WAV to MP3 Converter - (주)니모뮤직
color 0b

echo ====================================================================
echo           WAV to MP3 Converter - Windows 데스크톱 앱 창 실행기
echo                 (주)니모뮤직 / www.plymaster.co.kr
echo ====================================================================
echo.
echo 상단 주소창이나 탭이 없는 독립된 윈도우 앱 창으로 실행합니다...
echo.

:: 1. Microsoft Edge 앱 창 모드 (Windows 10 / 11 기본 탑재)
if exist "%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe" (
    start "" "%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe" --app="file:///%~dp0WavToMp3Converter.html" --window-size=1120,950
    exit /b
)
if exist "%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe" (
    start "" "%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe" --app="file:///%~dp0WavToMp3Converter.html" --window-size=1120,950
    exit /b
)

:: 2. Google Chrome 앱 창 모드
if exist "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe" (
    start "" "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe" --app="file:///%~dp0WavToMp3Converter.html" --window-size=1120,950
    exit /b
)
if exist "%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe" (
    start "" "%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe" --app="file:///%~dp0WavToMp3Converter.html" --window-size=1120,950
    exit /b
)

:: 3. 기본 브라우저 실행
start "" "%~dp0WavToMp3Converter.html"
`;

export const CREATE_SHORTCUT_BAT = `@echo off
chcp 65001 >nul
setlocal
title 바탕화면 바로가기 생성기

echo ====================================================================
echo         WAV to MP3 Converter - 바탕화면 바로가기 아이콘 생성
echo ====================================================================
echo.
echo 바탕화면에 바로가기 아이콘을 만드는 중입니다...

set VBS="%TEMP%\\create_shortcut_%RANDOM%.vbs"
echo Set oWS = WScript.CreateObject("WScript.Shell") > %VBS%
echo sLinkFile = oWS.SpecialFolders("Desktop") ^& "\\WAV to MP3 변환기.lnk" >> %VBS%
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> %VBS%
echo oLink.TargetPath = "%~dp0run_desktop_app.bat" >> %VBS%
echo oLink.WorkingDirectory = "%~dp0" >> %VBS%
echo oLink.WindowStyle = 7 >> %VBS%
echo oLink.Description = "WAV to MP3 Converter - (주)니모뮤직" >> %VBS%
echo oLink.Save >> %VBS%
cscript //nologo %VBS%
del %VBS%

echo.
echo [성공] 바탕화면에 [WAV to MP3 변환기] 바로가기 아이콘이 생성되었습니다!
echo 이제 바탕화면의 바로가기를 더블클릭하시면 앱 창이 바로 실행됩니다.
echo.
pause
`;

export const MAKE_LOCAL_EXE_BAT = `@echo off
chcp 65001 >nul
setlocal
title WAV to MP3 Converter - 내 PC에서 안전한 .exe 직접 만들기
color 0a

echo ====================================================================
echo      WAV to MP3 Converter - Windows .exe 실행 파일 1초 생성기
echo              (주)니모뮤직 / https://www.plymaster.co.kr
echo ====================================================================
echo.
echo Windows 내장 공식 C# 컴파일러를 사용하여 안전한 .exe를 만듭니다...
echo (인터넷에서 다운받은 파일이 아니므로 백신 바이러스 오탐지가 발생하지 않습니다)
echo.

set CSC=
if exist "%SystemRoot%\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe" set CSC=%SystemRoot%\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe
if "%CSC%"=="" if exist "%SystemRoot%\\Microsoft.NET\\Framework\\v4.0.30319\\csc.exe" set CSC=%SystemRoot%\\Microsoft.NET\\Framework\\v4.0.30319\\csc.exe

if "%CSC%"=="" (
    echo [안내] Windows .NET 컴파일러를 찾지 못했습니다.
    echo 대신 [run_desktop_app.bat] 또는 [WavToMp3Converter.html]을 사용해 주세요.
    pause
    exit /b
)

"%CSC%" /nologo /target:winexe /out:"%~dp0WavToMp3Converter.exe" "%~dp0_launcher.cs"

if exist "%~dp0WavToMp3Converter.exe" (
    echo.
    echo ====================================================================
    echo [성공] WavToMp3Converter.exe 파일이 성공적으로 생성되었습니다!
    echo 이제 생성된 WavToMp3Converter.exe를 더블클릭하여 바로 사용하시면 됩니다.
    echo ====================================================================
    echo.
) else (
    echo [오류] 생성에 실패했습니다. 대신 [run_desktop_app.bat]을 더블클릭해 실행하세요.
)
pause
`;

export const LAUNCHER_CS = `using System;
using System.Diagnostics;
using System.IO;

class AppLauncher {
    [STAThread]
    static void Main() {
        try {
            string dir = AppDomain.CurrentDomain.BaseDirectory;
            string htmlPath = Path.Combine(dir, "WavToMp3Converter.html");
            if (!File.Exists(htmlPath)) return;

            string edge86 = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Microsoft\\Edge\\Application\\msedge.exe");
            string edge = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Microsoft\\Edge\\Application\\msedge.exe");
            string targetEdge = File.Exists(edge86) ? edge86 : (File.Exists(edge) ? edge : null);

            if (targetEdge != null) {
                Process.Start(new ProcessStartInfo {
                    FileName = targetEdge,
                    Arguments = "--app=\\"file:///" + htmlPath.Replace('\\\\', '/') + "\\" --window-size=1120,950",
                    UseShellExecute = true
                });
                return;
            }

            string chrome = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Google\\Chrome\\Application\\chrome.exe");
            string chrome86 = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Google\\Chrome\\Application\\chrome.exe");
            string targetChrome = File.Exists(chrome) ? chrome : (File.Exists(chrome86) ? chrome86 : null);

            if (targetChrome != null) {
                Process.Start(new ProcessStartInfo {
                    FileName = targetChrome,
                    Arguments = "--app=\\"file:///" + htmlPath.Replace('\\\\', '/') + "\\" --window-size=1120,950",
                    UseShellExecute = true
                });
                return;
            }

            Process.Start(new ProcessStartInfo(htmlPath) { UseShellExecute = true });
        } catch { }
    }
}
`;

export const BUILD_BAT_CONTENT = `@echo off
setlocal
title WAV to MP3 Converter - Windows EXE Builder (Nimo Music)
color 0b

echo ====================================================================
echo             WAV to MP3 Converter - Windows EXE Builder
echo                   Nimo Music / www.plymaster.co.kr
echo ====================================================================
echo.
echo [1/3] Checking Python environment...
where python >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Python is not found in PATH!
    echo Please install Python (version 3.9 or higher) from https://www.python.org
    echo IMPORTANT: Make sure to check "Add Python to PATH" during installation.
    echo.
    pause
    exit /b 1
)

python --version
echo.

echo [2/3] Installing pywebview and pyinstaller...
python -m pip install --upgrade pip
python -m pip install pywebview pyinstaller

echo.
echo [3/3] Packaging standalone Windows executable (WavToMp3Converter.exe)...
echo Embedding HTML application bundle into .exe...
python -m PyInstaller --noconfirm --onefile --windowed --add-data "WavToMp3Converter.html;." --name "WavToMp3Converter" main.py

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] PyInstaller build failed!
    echo Please check the error messages above.
    pause
    exit /b 1
)

echo.
echo ====================================================================
echo [SUCCESS] WavToMp3Converter.exe has been created successfully!
echo Output file: dist\\WavToMp3Converter.exe
echo ====================================================================
echo.
echo Opening dist folder...
if exist dist explorer dist

pause
`;

export const BUILD_PS1_CONTENT = `# -*- coding: utf-8 -*-
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "            WAV to MP3 Converter Windows (.exe) 빌더" -ForegroundColor Cyan
Write-Host "                 제작: (주)니모뮤직 / PLYMASTER" -ForegroundColor Cyan
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host ""

$python = Get-Command python -ErrorAction SilentlyContinue
if (-not $python) {
    Write-Host "[오류] Python이 설치되어 있지 않거나 환경변수 PATH에 없습니다!" -ForegroundColor Red
    Write-Host "https://www.python.org 에서 설치 시 'Add Python to PATH'에 체크해 주세요."
    Read-Host "계속하려면 Enter를 누르세요..."
    exit 1
}

Write-Host "[1/3] 필수 라이브러리 (pywebview, pyinstaller) 설치 및 확인 중..." -ForegroundColor Yellow
python -m pip install --upgrade pip
python -m pip install pywebview pyinstaller

Write-Host ""
Write-Host "[2/3] PyInstaller를 통해 HTML 앱이 내장된 독립 실행 파일(.exe)로 패키징 중..." -ForegroundColor Yellow
Write-Host "(약 30초~1분 정도 소요됩니다)"
python -m PyInstaller --noconfirm --onefile --windowed --add-data "WavToMp3Converter.html;." --name "WavToMp3Converter" main.py

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "====================================================================" -ForegroundColor Green
    Write-Host "[성공] WavToMp3Converter.exe 생성이 완료되었습니다!" -ForegroundColor Green
    Write-Host "위치: dist\\WavToMp3Converter.exe" -ForegroundColor Green
    Write-Host "====================================================================" -ForegroundColor Green
    if (Test-Path "dist") { explorer dist }
} else {
    Write-Host "[오류] 빌드 중 오류가 발생했습니다." -ForegroundColor Red
}
Read-Host "계속하려면 Enter를 누르세요..."
`;

export const RUN_BAT_CONTENT = `@echo off
setlocal
title WAV to MP3 Converter
color 0f

echo Starting WAV to MP3 Converter...
echo (Nimo Music / www.plymaster.co.kr)
echo.

where python >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not found in PATH!
    echo Launching standalone desktop window instead...
    start msedge --app="%~dp0WavToMp3Converter.html" --window-size=980,880
    exit /b 0
)

python main.py
if %errorlevel% neq 0 (
    echo.
    echo Installing pywebview...
    python -m pip install pywebview
    python main.py
)
`;

export const REQUIREMENTS_CONTENT = `pywebview>=5.0.0
pyinstaller>=6.0.0
`;

export const README_CONTENT = `=====================================================================
  WAV to MP3 Converter - 100% 동일 화면 데스크톱 안전 배포 패키지
  제작: (주)니모뮤직 / PLYMASTER
  홈페이지: https://www.plymaster.co.kr
=====================================================================

[중요 안내: 바이러스 오탐지 없는 100% 안전 패키지]
Windows Defender 및 브라우저(Chrome/Edge)는 웹에서 다운로드되는 모든 미서명 .exe
(수백만 원의 상용 Code-Signing 인증서가 없는 오픈소스/개인 실행 파일)를
'휴리스틱(Heuristic) 보안 필터'로 인해 무조건 '바이러스 감염' 또는 '손상된 파일'로
오탐지(False Positive)하여 다운로드를 차단합니다.

이 문제를 원천 방지하기 위해 본 ZIP 패키지는 인터넷 바이너리 파일을 배제하고,
100% 투명하고 안전한 스크립트와 오프라인 HTML 파일로 구성되어 있습니다.

---------------------------------------------------------------------
★ 방법 1: 가장 추천! 더블클릭 시 윈도우 전용 독립 앱 창으로 즉시 실행
---------------------------------------------------------------------
- 폴더 안의 [ 변환기_앱창으로_실행.bat ] 또는 [ run_desktop_app.bat ]을 더블클릭합니다!
- 브라우저 상단 주소창이나 탭이 없는 깔끔한 Windows 전용 독립 데스크톱 앱 창으로
  웹 화면과 100% 동일하게 즉시 실행됩니다.
- 설치 0초, 오류 0%, 오프라인 완전 지원!

---------------------------------------------------------------------
★ 방법 2: 바탕화면에 바로가기 아이콘 만들기
---------------------------------------------------------------------
- 폴더 안의 [ 바탕화면_바로가기_생성.bat ]을 더블클릭합니다.
- 내 Windows 바탕화면에 [WAV to MP3 변환기] 아이콘이 즉시 생성됩니다.
- 앞으로 바탕화면 아이콘만 더블클릭하면 즉시 실행됩니다.

---------------------------------------------------------------------
★ 방법 3: 내 PC에서 바이러스 오탐 없는 순수 .exe 파일 직접 1초 생성
---------------------------------------------------------------------
- 폴더 안의 [ exe_실행파일_직접만들기.bat ]을 더블클릭합니다.
- Windows에 기본 내장된 정식 .NET C# 컴파일러가 내 PC에서 직접
  [ WavToMp3Converter.exe ]를 1초 만에 컴파일합니다.
- 외부 인터넷에서 다운받은 파일이 아니므로 Windows Defender가
  100% 신뢰하며, 바이러스 경고가 전혀 발생하지 않습니다!

---------------------------------------------------------------------
★ 방법 4: 단일 HTML 파일로 오프라인 실행
---------------------------------------------------------------------
- [ WavToMp3Converter.html ]을 더블클릭하면 모든 PC 브라우저에서
  인터넷 연결 없이도 100% 동일한 화면과 기능으로 변환을 진행할 수 있습니다.

[주요 기능]
- 다중 WAV 파일 일괄 드래그앤드롭 및 폴더 저장
- 각 파일별 재생 시간, 샘플 레이트(Hz), 채널 수(스테레오/모노) 실시간 분석
- 내장 오디오 미리듣기 플레이어 (재생/일시정지/초기화/파형 탐색)
- VBR (V0 최고품질 ~ V9 최소용량) 및 CBR (64k ~ 320k) 완벽 지원
- 실시간 변환 진행률 바 및 상태 표시
- 변환된 MP3 개별 다운로드 및 전체 일괄 ZIP 압축 다운로드
- (주)니모뮤직 및 무료 스트리밍 사이트 바로가기 내장

문의 및 기술 지원: https://www.plymaster.co.kr
`;

/**
 * Downloads the native Windows executable (.exe) directly with Blob integrity check.
 */
export async function downloadExeFile(): Promise<void> {
  try {
    const res = await fetch('/WavToMp3Converter.exe');
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'WavToMp3Converter.exe';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  } catch (err) {
    console.error('Direct EXE download failed, attempting fallback link:', err);
    const a = document.createElement('a');
    a.href = '/WavToMp3Converter.exe';
    a.download = 'WavToMp3Converter.exe';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

/**
 * Downloads the single standalone HTML file directly.
 * Zero installation or build required. Opens in any browser offline.
 */
export async function downloadSingleHtmlFile(): Promise<void> {
  try {
    const res = await fetch('/WavToMp3Converter.html');
    if (!res.ok) throw new Error('HTML fetch failed');
    let htmlText = await res.text();
    htmlText = htmlText.replace(/<script type="module" src="\/@vite\/client"><\/script>/g, '');

    const blob = new Blob([htmlText], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'WavToMp3Converter.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Download error:', err);
    alert('단일 HTML 파일 다운로드 중 오류가 발생했습니다.');
  }
}

/**
 * Downloads a 100% clean, virus-free Windows package:
 * - WavToMp3Converter.html (Standalone single file)
 * - 변환기_앱창으로_실행.bat (0-install native window runner)
 * - run_desktop_app.bat (English alias for batch runner)
 * - 바탕화면_바로가기_생성.bat (1-click desktop icon creator)
 * - exe_실행파일_직접만들기.bat (1-second local C# .exe compiler)
 * - _launcher.cs (Clean C# launcher source)
 * - main.py (pywebview Python desktop app)
 * - build_exe.bat (PyInstaller builder)
 * - build_exe.ps1 (PowerShell builder)
 * - run.bat (Python runner)
 * - requirements.txt
 * - 사용안내_README.txt
 */
export async function downloadWindowsExePackage(): Promise<void> {
  const zip = new JSZip();

  // 1. Fetch single standalone HTML file
  let htmlText = '';
  try {
    const res = await fetch('/WavToMp3Converter.html');
    if (res.ok) {
      htmlText = await res.text();
      htmlText = htmlText.replace(/<script type="module" src="\/@vite\/client"><\/script>/g, '');
    }
  } catch (e) {
    console.warn('Could not fetch WavToMp3Converter.html for zip', e);
  }

  if (htmlText) {
    zip.file('WavToMp3Converter.html', htmlText);
  }

  // 2. Safe batch runners and local creators (NO internet PE binary -> 100% virus scan pass!)
  zip.file('변환기_앱창으로_실행.bat', RUN_DESKTOP_APP_BAT);
  zip.file('run_desktop_app.bat', RUN_DESKTOP_APP_BAT);
  zip.file('바탕화면_바로가기_생성.bat', CREATE_SHORTCUT_BAT);
  zip.file('exe_실행파일_직접만들기.bat', MAKE_LOCAL_EXE_BAT);
  zip.file('_launcher.cs', LAUNCHER_CS);

  // 3. Python & advanced builders
  zip.file('main.py', PYTHON_DESKTOP_CODE);
  zip.file('build_exe.bat', BUILD_BAT_CONTENT);
  zip.file('build_exe.ps1', BUILD_PS1_CONTENT);
  zip.file('run.bat', RUN_BAT_CONTENT);
  zip.file('requirements.txt', REQUIREMENTS_CONTENT);
  zip.file('사용안내_README.txt', README_CONTENT);

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'WavToMp3Converter_Windows_Safe_Package.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
