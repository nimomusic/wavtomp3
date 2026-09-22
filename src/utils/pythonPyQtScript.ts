export const PYTHON_PYQT6_CODE = `"""
WAV to MP3 Converter - PyQt6 Desktop Application
================================================
깔끔하고 직관적인 PyQt6 기반 WAV to MP3 변환기
- VBR (품질 슬라이더 V0 ~ V9) 및 CBR (고정 비트레이트 선택) 지원
- QProgressBar 및 실시간 상태 표시
- 파일 선택, 저장 경로 선택, QThread 백그라운드 변환
- 시스템 요구 사항: pip install PyQt6 (ffmpeg 설치 권장)
"""

import sys
import os
import subprocess
import re
from PyQt6.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
    QGroupBox, QRadioButton, QSlider, QComboBox, QPushButton,
    QProgressBar, QLabel, QFileDialog, QStatusBar, QMessageBox,
    QLineEdit, QButtonGroup, QFrame
)
from PyQt6.QtCore import Qt, QThread, pyqtSignal
from PyQt6.QtGui import QFont, QIcon


class ConversionThread(QThread):
    """백그라운드에서 오디오 변환을 수행하는 스레드"""
    progress_updated = pyqtSignal(int, str)
    conversion_finished = pyqtSignal(bool, str)

    def __init__(self, input_file, output_file, mode, vbr_quality, cbr_bitrate):
        super().__init__()
        self.input_file = input_file
        self.output_file = output_file
        self.mode = mode
        self.vbr_quality = vbr_quality
        self.cbr_bitrate = cbr_bitrate
        self.is_cancelled = False

    def run(self):
        try:
            self.progress_updated.emit(10, "변환 프로세스 준비 중...")

            # FFmpeg 명령어 구성
            # VBR: -q:a <quality> (0~9, 0이 최고품질)
            # CBR: -b:a <bitrate>k
            cmd = ["ffmpeg", "-y", "-i", self.input_file]
            
            if self.mode == "VBR":
                cmd.extend(["-codec:a", "libmp3lame", "-q:a", str(self.vbr_quality)])
            else:
                cmd.extend(["-codec:a", "libmp3lame", "-b:a", f"{self.cbr_bitrate}k"])
                
            cmd.append(self.output_file)

            self.progress_updated.emit(30, "오디오 인코딩 실행 중...")

            # FFmpeg 실행 (subprocess)
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                universal_newlines=True,
                creationflags=subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0
            )

            # 진행 시뮬레이션 및 완료 대기
            step = 30
            while process.poll() is None:
                if self.is_cancelled:
                    process.terminate()
                    self.conversion_finished.emit(False, "사용자에 의해 변환이 취소되었습니다.")
                    return
                step = min(95, step + 10)
                self.progress_updated.emit(step, f"인코딩 진행 중 ({step}%)...")
                self.msleep(200)

            stdout, stderr = process.communicate()

            if process.returncode == 0:
                self.progress_updated.emit(100, "변환 완료!")
                self.conversion_finished.emit(True, f"성공적으로 저장되었습니다:\\n{self.output_file}")
            else:
                self.conversion_finished.emit(False, f"변환 실패 (FFmpeg 오류):\\n{stderr[-300:]}")

        except FileNotFoundError:
            self.conversion_finished.emit(
                False, 
                "FFmpeg가 설치되어 있지 않습니다.\\n"
                "시스템에 FFmpeg를 설치하고 PATH 환경 변수에 등록해 주세요."
            )
        except Exception as e:
            self.conversion_finished.emit(False, f"오류 발생: {str(e)}")

    def cancel(self):
        self.is_cancelled = True


class WavToMp3ConverterApp(QMainWindow):
    """PyQt6 메인 윈도우 인터페이스"""

    def __init__(self):
        super().__init__()
        self.input_file_path = ""
        self.output_dir_path = os.path.expanduser("~/Music")
        self.conversion_thread = None
        self.init_ui()

    def init_ui(self):
        self.setWindowTitle("WAV to MP3 Converter - PyQt6")
        self.setFixedSize(580, 620)
        self.setStyleSheet(self.get_stylesheet())

        # 중앙 위젯 및 기본 레이아웃
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        main_layout = QVBoxLayout(central_widget)
        main_layout.setContentsMargins(18, 18, 18, 18)
        main_layout.setSpacing(14)

        # 1. 파일 선택 그룹 (QGroupBox)
        file_group = QGroupBox("1. 원본 WAV 파일 선택")
        file_layout = QVBoxLayout(file_group)

        file_h_layout = QHBoxLayout()
        self.line_input_path = QLineEdit()
        self.line_input_path.setPlaceholderText("변환할 .wav 파일을 선택하세요...")
        self.line_input_path.setReadOnly(True)
        btn_browse_input = QPushButton("파일 찾기...")
        btn_browse_input.clicked.connect(self.browse_input_file)
        file_h_layout.addWidget(self.line_input_path)
        file_h_layout.addWidget(btn_browse_input)
        file_layout.addLayout(file_h_layout)

        self.lbl_file_info = QLabel("선택된 파일 없음")
        self.lbl_file_info.setStyleSheet("color: #718096; font-size: 11px;")
        file_layout.addWidget(self.lbl_file_info)
        main_layout.addWidget(file_group)

        # 2. 인코딩 옵션 그룹 (VBR vs CBR)
        enc_group = QGroupBox("2. 인코딩 설정 (VBR / CBR)")
        enc_layout = QVBoxLayout(enc_group)

        # 라디오 버튼 그룹
        radio_layout = QHBoxLayout()
        self.radio_vbr = QRadioButton("VBR (가변 비트레이트 - 권장)")
        self.radio_cbr = QRadioButton("CBR (고정 비트레이트)")
        self.radio_vbr.setChecked(True)

        self.btn_group = QButtonGroup()
        self.btn_group.addButton(self.radio_vbr)
        self.btn_group.addButton(self.radio_cbr)
        self.radio_vbr.toggled.connect(self.toggle_encoding_mode)

        radio_layout.addWidget(self.radio_vbr)
        radio_layout.addWidget(self.radio_cbr)
        enc_layout.addLayout(radio_layout)

        # VBR 컨트롤 (슬라이더)
        self.widget_vbr = QWidget()
        vbr_vbox = QVBoxLayout(self.widget_vbr)
        vbr_vbox.setContentsMargins(0, 4, 0, 0)
        
        vbr_header = QHBoxLayout()
        lbl_vbr_title = QLabel("품질 설정 (V0 최고품질 ~ V9 최소용량):")
        self.lbl_vbr_val = QLabel("V2 (약 190 kbps - 권장 표준)")
        self.lbl_vbr_val.setStyleSheet("font-weight: bold; color: #2b6cb0;")
        vbr_header.addWidget(lbl_vbr_title)
        vbr_header.addStretch()
        vbr_header.addWidget(self.lbl_vbr_val)
        vbr_vbox.addLayout(vbr_header)

        self.slider_vbr = QSlider(Qt.Orientation.Horizontal)
        self.slider_vbr.setRange(0, 9)
        self.slider_vbr.setValue(2)
        self.slider_vbr.setTickPosition(QSlider.TickPosition.TicksBelow)
        self.slider_vbr.setTickInterval(1)
        self.slider_vbr.valueChanged.connect(self.update_vbr_label)
        vbr_vbox.addWidget(self.slider_vbr)
        enc_layout.addWidget(self.widget_vbr)

        # CBR 컨트롤 (콤보박스)
        self.widget_cbr = QWidget()
        cbr_vbox = QVBoxLayout(self.widget_cbr)
        cbr_vbox.setContentsMargins(0, 4, 0, 0)
        
        cbr_header = QHBoxLayout()
        lbl_cbr_title = QLabel("고정 비트레이트 선택:")
        self.combo_cbr = QComboBox()
        self.combo_cbr.addItems([
            "320 kbps (스튜디오 최고 품질)",
            "256 kbps (고품질 음원)",
            "192 kbps (권장 CD 음질)",
            "160 kbps (준표준)",
            "128 kbps (인터넷 라디오 표준)",
            "96 kbps (음성/강의)",
            "64 kbps (경량 음성)"
        ])
        self.combo_cbr.setCurrentIndex(2)  # 192 kbps 기본
        cbr_header.addWidget(lbl_cbr_title)
        cbr_header.addWidget(self.combo_cbr)
        cbr_vbox.addLayout(cbr_header)
        self.widget_cbr.setVisible(False)
        enc_layout.addWidget(self.widget_cbr)

        main_layout.addWidget(enc_group)

        # 3. 저장 위치 설정 그룹
        save_group = QGroupBox("3. 저장 경로 및 파일명")
        save_layout = QVBoxLayout(save_group)

        save_h_layout = QHBoxLayout()
        self.line_output_path = QLineEdit()
        self.line_output_path.setText(self.output_dir_path)
        btn_browse_output = QPushButton("폴더 선택...")
        btn_browse_output.clicked.connect(self.browse_output_dir)
        save_h_layout.addWidget(self.line_output_path)
        save_h_layout.addWidget(btn_browse_output)
        save_layout.addLayout(save_h_layout)

        output_name_layout = QHBoxLayout()
        output_name_layout.addWidget(QLabel("출력 파일명:"))
        self.line_output_name = QLineEdit("output.mp3")
        output_name_layout.addWidget(self.line_output_name)
        save_layout.addLayout(output_name_layout)

        main_layout.addWidget(save_group)

        # 4. 진행 상태 바 및 버튼
        status_group = QGroupBox("4. 변환 진행 상태")
        status_layout = QVBoxLayout(status_group)

        self.progress_bar = QProgressBar()
        self.progress_bar.setRange(0, 100)
        self.progress_bar.setValue(0)
        self.progress_bar.setTextVisible(True)
        status_layout.addWidget(self.progress_bar)

        self.lbl_status_detail = QLabel("대기 중...")
        self.lbl_status_detail.setStyleSheet("color: #4a5568; font-size: 11px;")
        status_layout.addWidget(self.lbl_status_detail)
        main_layout.addWidget(status_group)

        # 하단 액션 버튼
        btn_layout = QHBoxLayout()
        self.btn_convert = QPushButton("MP3로 변환 시작")
        self.btn_convert.setStyleSheet("""
            QPushButton {
                background-color: #2b6cb0;
                color: white;
                font-weight: bold;
                padding: 10px 18px;
                border-radius: 5px;
                font-size: 13px;
            }
            QPushButton:hover { background-color: #2c5282; }
            QPushButton:disabled { background-color: #a0aec0; }
        """)
        self.btn_convert.clicked.connect(self.start_conversion)

        self.btn_cancel = QPushButton("중지")
        self.btn_cancel.setEnabled(False)
        self.btn_cancel.clicked.connect(self.cancel_conversion)

        btn_layout.addWidget(self.btn_convert, 3)
        btn_layout.addWidget(self.btn_cancel, 1)
        main_layout.addLayout(btn_layout)

        # 상태 표시줄
        self.status_bar = QStatusBar()
        self.setStatusBar(self.status_bar)
        self.status_bar.showMessage("준비 완료 - WAV 파일을 선택해 주세요.")

    def toggle_encoding_mode(self):
        is_vbr = self.radio_vbr.isChecked()
        self.widget_vbr.setVisible(is_vbr)
        self.widget_cbr.setVisible(not is_vbr)

    def update_vbr_label(self, value):
        desc_map = {
            0: "V0 (약 245 kbps - 최고 품질)",
            1: "V1 (약 225 kbps - 매우 높음)",
            2: "V2 (약 190 kbps - 권장 표준)",
            3: "V3 (약 175 kbps - 중상 품질)",
            4: "V4 (약 165 kbps - 보통)",
            5: "V5 (약 130 kbps - 절약형)",
            6: "V6 (약 115 kbps - 경제적)",
            7: "V7 (약 100 kbps - 음성 녹음)",
            8: "V8 (약 85 kbps - 초저용량)",
            9: "V9 (약 65 kbps - 최소 용량)"
        }
        self.lbl_vbr_val.setText(desc_map.get(value, f"V{value}"))

    def browse_input_file(self):
        file_path, _ = QFileDialog.getOpenFileName(
            self, "WAV 파일 선택", "", "WAV Audio (*.wav)"
        )
        if file_path:
            self.input_file_path = file_path
            self.line_input_path.setText(file_path)
            file_size_mb = os.path.getsize(file_path) / (1024 * 1024)
            file_name = os.path.basename(file_path)
            self.lbl_file_info.setText(f"파일: {file_name} ({file_size_mb:.2f} MB)")
            
            # 자동 출력 파일명 설정
            base_name = os.path.splitext(file_name)[0]
            self.line_output_name.setText(f"{base_name}.mp3")
            self.status_bar.showMessage(f"파일 로드 완료: {file_name}")

    def browse_output_dir(self):
        dir_path = QFileDialog.getExistingDirectory(
            self, "저장 폴더 선택", self.output_dir_path
        )
        if dir_path:
            self.output_dir_path = dir_path
            self.line_output_path.setText(dir_path)

    def start_conversion(self):
        if not self.input_file_path or not os.path.exists(self.input_file_path):
            QMessageBox.warning(self, "경고", "변환할 WAV 파일을 먼저 선택해 주세요.")
            return

        out_name = self.line_output_name.text().strip()
        if not out_name.lower().endswith(".mp3"):
            out_name += ".mp3"

        out_dir = self.line_output_path.text().strip()
        final_output_path = os.path.join(out_dir, out_name)

        mode = "VBR" if self.radio_vbr.isChecked() else "CBR"
        vbr_val = self.slider_vbr.value()
        cbr_text = self.combo_cbr.currentText()
        cbr_val = int(re.search(r"\\d+", cbr_text).group()) if re.search(r"\\d+", cbr_text) else 192

        # UI 상태 업데이트
        self.btn_convert.setEnabled(False)
        self.btn_cancel.setEnabled(True)
        self.progress_bar.setValue(0)
        self.status_bar.showMessage("변환 작업 진행 중...")

        # 스레드 실행
        self.conversion_thread = ConversionThread(
            self.input_file_path, final_output_path, mode, vbr_val, cbr_val
        )
        self.conversion_thread.progress_updated.connect(self.on_progress)
        self.conversion_thread.conversion_finished.connect(self.on_finished)
        self.conversion_thread.start()

    def cancel_conversion(self):
        if self.conversion_thread and self.conversion_thread.isRunning():
            self.conversion_thread.cancel()
            self.btn_cancel.setEnabled(False)
            self.status_bar.showMessage("취소 요청 중...")

    def on_progress(self, percentage, message):
        self.progress_bar.setValue(percentage)
        self.lbl_status_detail.setText(message)

    def on_finished(self, success, message):
        self.btn_convert.setEnabled(True)
        self.btn_cancel.setEnabled(False)
        if success:
            self.status_bar.showMessage("변환 성공!")
            QMessageBox.information(self, "변환 완료", message)
        else:
            self.status_bar.showMessage("변환 중 오류 발생")
            QMessageBox.critical(self, "변환 오류", message)

    def get_stylesheet(self):
        return """
        QWidget {
            font-family: 'Segoe UI', 'Malgun Gothic', sans-serif;
            font-size: 12px;
            color: #2d3748;
            background-color: #f7fafc;
        }
        QGroupBox {
            font-weight: bold;
            border: 1px solid #cbd5e0;
            border-radius: 6px;
            margin-top: 10px;
            padding-top: 12px;
            background-color: #ffffff;
        }
        QGroupBox::title {
            subcontrol-origin: margin;
            subcontrol-position: top left;
            padding: 0 6px;
            color: #2b6cb0;
        }
        QLineEdit {
            border: 1px solid #cbd5e0;
            border-radius: 4px;
            padding: 5px 8px;
            background-color: #edf2f7;
        }
        QPushButton {
            background-color: #edf2f7;
            border: 1px solid #cbd5e0;
            border-radius: 4px;
            padding: 6px 12px;
        }
        QPushButton:hover {
            background-color: #e2e8f0;
        }
        QProgressBar {
            border: 1px solid #cbd5e0;
            border-radius: 4px;
            text-align: center;
            background-color: #edf2f7;
            height: 18px;
        }
        QProgressBar::chunk {
            background-color: #3182ce;
            border-radius: 3px;
        }
        QStatusBar {
            background-color: #edf2f7;
            border-top: 1px solid #e2e8f0;
            color: #4a5568;
        }
        """


if __name__ == '__main__':
    app = QApplication(sys.argv)
    window = WavToMp3ConverterApp()
    window.show()
    sys.exit(app.exec())
`;
