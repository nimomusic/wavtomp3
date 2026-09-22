import { Mp3Encoder } from '@breezystack/lamejs';
import { AudioFileInfo, CbrBitrate, ConversionProgress, ConvertedResult, EncodingMode, VbrQuality } from '../types';

// Map VBR quality preset (0-9) to standard LAME target bitrates
export const VBR_QUALITY_INFO: Record<VbrQuality, { label: string; estimatedKbps: number; description: string }> = {
  0: { label: 'V0 (최고 품질)', estimatedKbps: 245, description: '투명한 음질, 무손실에 근접한 최고 퀄리티 (약 220~260 kbps)' },
  1: { label: 'V1 (매우 높음)', estimatedKbps: 225, description: '오디오 애호가 및 고음질 감상용 (약 200~240 kbps)' },
  2: { label: 'V2 (권장 표준)', estimatedKbps: 190, description: 'LAME 표준 권장값, 음질과 용량의 최적 균형 (약 170~210 kbps)' },
  3: { label: 'V3 (중상 품질)', estimatedKbps: 175, description: '휴대용 기기 및 일반 음악 감상용 (약 150~195 kbps)' },
  4: { label: 'V4 (보통 품질)', estimatedKbps: 165, description: '균형 잡힌 스트리밍/모바일용 (약 140~185 kbps)' },
  5: { label: 'V5 (절약 품질)', estimatedKbps: 130, description: '용량 절약 음악 및 배경음용 (약 120~150 kbps)' },
  6: { label: 'V6 (경제적)', estimatedKbps: 115, description: '인터넷 라디오 및 팟캐스트용 (약 100~130 kbps)' },
  7: { label: 'V7 (저용량)', estimatedKbps: 100, description: '음성 녹음 및 강의 음성용 (약 80~120 kbps)' },
  8: { label: 'V8 (초저용량)', estimatedKbps: 85, description: '용량 최소화 통화 음성용 (약 70~105 kbps)' },
  9: { label: 'V9 (최소 용량)', estimatedKbps: 65, description: '최저 대역폭 음성 메시지용 (약 45~85 kbps)' },
};

export const CBR_BITRATE_INFO: Record<CbrBitrate, { label: string; description: string }> = {
  320: { label: '320 kbps (스튜디오 최고 품질)', description: 'MP3 규격 최대 비트레이트, 스튜디오 마스터링용' },
  256: { label: '256 kbps (고품질 음원)', description: '오디오 스트리밍 프리미엄 음질' },
  192: { label: '192 kbps (권장 CD 음질)', description: '가장 널리 쓰이는 표준 고음질' },
  160: { label: '160 kbps (준표준 음질)', description: '용량과 음질 균형' },
  128: { label: '128 kbps (표준 웹 음질)', description: '기본 웹 배포 및 인터넷 라디오 표준' },
  96: { label: '96 kbps (음성/팟캐스트)', description: '음성 콘텐츠 및 강의 녹음' },
  64: { label: '64 kbps (경량 음성)', description: '음성 메모 및 초저용량 보관용' },
};

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
}

/**
 * Decodes a WAV file to AudioBuffer and extracts metadata
 */
export async function decodeAudioFile(file: File): Promise<AudioFileInfo> {
  const arrayBuffer = await file.arrayBuffer();
  const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioCtx = new AudioContextClass();

  try {
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    const objectUrl = URL.createObjectURL(file);

    return {
      file,
      name: file.name,
      size: file.size,
      duration: audioBuffer.duration,
      sampleRate: audioBuffer.sampleRate,
      channels: audioBuffer.numberOfChannels,
      audioBuffer,
      objectUrl,
    };
  } finally {
    await audioCtx.close();
  }
}

/**
 * Converts Float32Array PCM (-1.0 to 1.0) into Int16Array (-32768 to 32767)
 */
function floatToInt16(float32Array: Float32Array): Int16Array {
  const len = float32Array.length;
  const int16Array = new Int16Array(len);
  for (let i = 0; i < len; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return int16Array;
}

/**
 * Converts decoded AudioBuffer to MP3 with real progress reporting
 */
export async function convertWavToMp3(
  audioBuffer: AudioBuffer,
  options: {
    mode: EncodingMode;
    vbrQuality: VbrQuality;
    cbrBitrate: CbrBitrate;
    outputFileName: string;
  },
  onProgress: (progress: ConversionProgress) => void,
  isCancelled: () => boolean
): Promise<ConvertedResult> {
  const startTime = performance.now();
  const channels = Math.min(2, audioBuffer.numberOfChannels);
  const sampleRate = audioBuffer.sampleRate;
  const totalSamples = audioBuffer.length;

  // Determine bitrate for encoder
  const kbps = options.mode === 'VBR' 
    ? VBR_QUALITY_INFO[options.vbrQuality].estimatedKbps 
    : options.cbrBitrate;

  const mp3encoder = new Mp3Encoder(channels, sampleRate, kbps);

  // Convert channels to Int16
  const leftInt16 = floatToInt16(audioBuffer.getChannelData(0));
  const rightInt16 = channels > 1 ? floatToInt16(audioBuffer.getChannelData(1)) : leftInt16;

  const mp3Data: Uint8Array[] = [];
  const chunkSize = 1152 * 8; // 9216 samples per iteration
  const totalChunks = Math.ceil(totalSamples / chunkSize);

  let currentChunk = 0;
  let offset = 0;

  while (offset < totalSamples) {
    if (isCancelled()) {
      throw new Error('사용자에 의해 변환이 취소되었습니다.');
    }

    const currentChunkSize = Math.min(chunkSize, totalSamples - offset);
    const leftSlice = leftInt16.subarray(offset, offset + currentChunkSize);
    const rightSlice = channels > 1 ? rightInt16.subarray(offset, offset + currentChunkSize) : leftSlice;

    const mp3buf = channels === 1
      ? mp3encoder.encodeBuffer(leftSlice)
      : mp3encoder.encodeBuffer(leftSlice, rightSlice);

    if (mp3buf.length > 0) {
      mp3Data.push(new Uint8Array(mp3buf));
    }

    offset += currentChunkSize;
    currentChunk++;

    const progressRatio = offset / totalSamples;
    const elapsedSeconds = (performance.now() - startTime) / 1000;
    const speed = progressRatio > 0 ? (offset / sampleRate) / elapsedSeconds : 0;
    const remainingSeconds = progressRatio > 0 && progressRatio < 1 
      ? (elapsedSeconds / progressRatio) * (1 - progressRatio) 
      : 0;

    onProgress({
      percentage: Math.min(100, Math.round(progressRatio * 100)),
      currentChunk,
      totalChunks,
      elapsedSeconds,
      estimatedRemainingSeconds: Math.max(0, remainingSeconds),
      conversionSpeed: parseFloat(speed.toFixed(1)),
    });

    // Yield to main thread every few chunks so UI renders smoothly
    if (currentChunk % 4 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  // Flush remaining buffer
  const finalBuf = mp3encoder.flush();
  if (finalBuf.length > 0) {
    mp3Data.push(new Uint8Array(finalBuf));
  }

  const mp3Blob = new Blob(mp3Data, { type: 'audio/mp3' });
  const conversionTimeMs = performance.now() - startTime;
  const rawPcmSize = totalSamples * channels * 2;
  const compressionRatio = rawPcmSize > 0 ? (1 - mp3Blob.size / rawPcmSize) * 100 : 0;

  return {
    blob: mp3Blob,
    url: URL.createObjectURL(mp3Blob),
    size: mp3Blob.size,
    fileName: options.outputFileName,
    conversionTimeMs,
    compressionRatio: parseFloat(compressionRatio.toFixed(1)),
  };
}

/**
 * Creates a synthetic melodic stereo WAV file for instantaneous testing
 */
export function createSampleWav(): File {
  const sampleRate = 44100;
  const duration = 4.0; // 4 seconds
  const totalSamples = Math.floor(sampleRate * duration);
  const numChannels = 2;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = totalSamples * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  // RIFF chunk length
  view.setUint32(4, 36 + dataSize, true);
  // RIFF type
  writeString(view, 8, 'WAVE');
  // format chunk identifier
  writeString(view, 12, 'fmt ');
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (1 = PCM)
  view.setUint16(20, 1, true);
  // channel count
  view.setUint16(22, numChannels, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate
  view.setUint32(28, byteRate, true);
  // block align
  view.setUint16(32, blockAlign, true);
  // bits per sample
  view.setUint16(34, 16, true);
  // data chunk identifier
  writeString(view, 36, 'data');
  // data chunk length
  view.setUint32(40, dataSize, true);

  // Generate musical chord progression: C major -> G major -> A minor -> F major
  // With bell-like decay and stereo panning
  const chords = [
    [261.63, 329.63, 392.00, 523.25], // Cmaj (C4, E4, G4, C5)
    [196.00, 246.94, 293.66, 392.00], // Gmaj (G3, B3, D4, G4)
    [220.00, 261.63, 329.63, 440.00], // Amin (A3, C4, E4, A4)
    [174.61, 220.00, 261.63, 349.23], // Fmaj (F3, A3, C4, F4)
  ];

  let offset = 44;
  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const chordIndex = Math.min(chords.length - 1, Math.floor(t / 1.0));
    const chordTime = t % 1.0;
    const currentNotes = chords[chordIndex];

    // Envelope with pluck/decay
    const envelope = Math.exp(-chordTime * 2.8) * Math.sin(Math.PI * Math.min(1, chordTime * 30));

    let sampleL = 0;
    let sampleR = 0;

    for (let n = 0; n < currentNotes.length; n++) {
      const freq = currentNotes[n];
      // fundamental + soft 2nd harmonic
      const tone = Math.sin(2 * Math.PI * freq * t) + 0.3 * Math.sin(4 * Math.PI * freq * t);
      // alternate stereo spread
      const pan = n % 2 === 0 ? 0.3 : 0.7;
      sampleL += tone * (1 - pan);
      sampleR += tone * pan;
    }

    sampleL = sampleL * envelope * 0.25;
    sampleR = sampleR * envelope * 0.25;

    // Convert to 16-bit PCM (-32768 to 32767)
    const intL = Math.max(-32768, Math.min(32767, Math.floor(sampleL * 32767)));
    const intR = Math.max(-32768, Math.min(32767, Math.floor(sampleR * 32767)));

    view.setInt16(offset, intL, true);
    view.setInt16(offset + 2, intR, true);
    offset += 4;
  }

  const blob = new Blob([buffer], { type: 'audio/wav' });
  return new File([blob], 'sample_harmony.wav', { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
