#define UNICODE
#define _UNICODE
#include <windows.h>
#include <shlobj.h>
#include <stdio.h>
#include <stdlib.h>

#define IDR_HTML_APP 101

static int FileExists(const wchar_t *path) {
    if (!path || wcslen(path) == 0) return 0;
    DWORD dwAttrib = GetFileAttributesW(path);
    return (dwAttrib != INVALID_FILE_ATTRIBUTES && !(dwAttrib & FILE_ATTRIBUTE_DIRECTORY));
}

int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nCmdShow) {
    (void)hPrevInstance;
    (void)lpCmdLine;
    (void)nCmdShow;

    // 1. Locate embedded HTML resource
    HRSRC hRes = FindResourceW(hInstance, MAKEINTRESOURCEW(IDR_HTML_APP), RT_RCDATA);
    if (!hRes) {
        MessageBoxW(
            NULL,
            L"애플리케이션 내장 리소스를 읽을 수 없습니다.\n압축 해제 후 재시도하시거나 WavToMp3Converter.html 파일을 브라우저로 직접 열어주세요.",
            L"WAV to MP3 Converter",
            MB_ICONERROR | MB_OK
        );
        return 1;
    }

    DWORD dwSize = SizeofResource(hInstance, hRes);
    HGLOBAL hGlob = LoadResource(hInstance, hRes);
    if (!hGlob || dwSize == 0) {
        MessageBoxW(NULL, L"리소스를 로드할 수 없습니다.", L"WAV to MP3 Converter", MB_ICONERROR | MB_OK);
        return 1;
    }

    const void *pData = LockResource(hGlob);
    if (!pData) {
        MessageBoxW(NULL, L"리소스를 잠금 해제할 수 없습니다.", L"WAV to MP3 Converter", MB_ICONERROR | MB_OK);
        return 1;
    }

    // 2. Prepare target directory in %TEMP%\WavToMp3 or %LOCALAPPDATA%\WavToMp3
    wchar_t targetDir[MAX_PATH] = {0};
    wchar_t htmlPath[MAX_PATH] = {0};

    // Use Temp folder by default for fastest, reliable write permissions
    if (GetTempPathW(MAX_PATH, targetDir) > 0) {
        wcscat(targetDir, L"NimoMusic_WavToMp3");
        CreateDirectoryW(targetDir, NULL);
        swprintf(htmlPath, MAX_PATH, L"%s\\WavToMp3Converter.html", targetDir);
    } else {
        if (SUCCEEDED(SHGetFolderPathW(NULL, CSIDL_LOCAL_APPDATA, NULL, 0, targetDir))) {
            wcscat(targetDir, L"\\WavToMp3");
            CreateDirectoryW(targetDir, NULL);
            swprintf(htmlPath, MAX_PATH, L"%s\\WavToMp3Converter.html", targetDir);
        } else {
            swprintf(htmlPath, MAX_PATH, L"WavToMp3Converter.html");
        }
    }

    // 3. Write HTML file to disk
    HANDLE hFile = CreateFileW(
        htmlPath,
        GENERIC_WRITE,
        FILE_SHARE_READ,
        NULL,
        CREATE_ALWAYS,
        FILE_ATTRIBUTE_NORMAL,
        NULL
    );

    if (hFile != INVALID_HANDLE_VALUE) {
        DWORD dwWritten = 0;
        WriteFile(hFile, pData, dwSize, &dwWritten, NULL);
        FlushFileBuffers(hFile);
        CloseHandle(hFile);
    } else {
        // Fallback: try writing directly in current directory
        swprintf(htmlPath, MAX_PATH, L"WavToMp3Converter.html");
        hFile = CreateFileW(
            htmlPath,
            GENERIC_WRITE,
            FILE_SHARE_READ,
            NULL,
            CREATE_ALWAYS,
            FILE_ATTRIBUTE_NORMAL,
            NULL
        );
        if (hFile != INVALID_HANDLE_VALUE) {
            DWORD dwWritten = 0;
            WriteFile(hFile, pData, dwSize, &dwWritten, NULL);
            FlushFileBuffers(hFile);
            CloseHandle(hFile);
        }
    }

    // 4. Locate browser for standalone App Window mode
    wchar_t browserPath[MAX_PATH] = {0};
    wchar_t localAppData[MAX_PATH] = {0};
    SHGetFolderPathW(NULL, CSIDL_LOCAL_APPDATA, NULL, 0, localAppData);

    wchar_t edgeUserPath[MAX_PATH];
    swprintf(edgeUserPath, MAX_PATH, L"%s\\Microsoft\\Edge\\Application\\msedge.exe", localAppData);
    wchar_t chromeUserPath[MAX_PATH];
    swprintf(chromeUserPath, MAX_PATH, L"%s\\Google\\Chrome\\Application\\chrome.exe", localAppData);

    const wchar_t *candidatePaths[] = {
        L"C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
        L"C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
        edgeUserPath,
        L"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        L"C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
        chromeUserPath,
        NULL
    };

    int browserFound = 0;
    for (int i = 0; candidatePaths[i] != NULL; i++) {
        if (FileExists(candidatePaths[i])) {
            wcscpy(browserPath, candidatePaths[i]);
            browserFound = 1;
            break;
        }
    }

    // 5. Launch in dedicated application window mode
    if (browserFound && FileExists(htmlPath)) {
        wchar_t cmdArgs[MAX_PATH * 3];
        swprintf(cmdArgs, sizeof(cmdArgs)/sizeof(wchar_t),
                 L"\"%s\" --app=\"file:///%s\" --window-size=1080,940",
                 browserPath, htmlPath);

        STARTUPINFOW si;
        PROCESS_INFORMATION pi;
        ZeroMemory(&si, sizeof(si));
        si.cb = sizeof(si);
        ZeroMemory(&pi, sizeof(pi));

        if (CreateProcessW(NULL, cmdArgs, NULL, NULL, FALSE, 0, NULL, NULL, &si, &pi)) {
            CloseHandle(pi.hProcess);
            CloseHandle(pi.hThread);
            return 0;
        }
    }

    // Fallback: ShellExecute with default browser
    HINSTANCE hInst = ShellExecuteW(NULL, L"open", htmlPath, NULL, NULL, SW_SHOWNORMAL);
    if ((INT_PTR)hInst <= 32) {
        MessageBoxW(
            NULL,
            L"변환기 앱을 실행하지 못했습니다.\n폴더에 포함된 'WavToMp3Converter.html' 파일을 더블 클릭하여 실행해 주세요.",
            L"WAV to MP3 Converter",
            MB_ICONINFORMATION | MB_OK
        );
    }

    return 0;
}
