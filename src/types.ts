export type EncodingMode = 'VBR' | 'CBR';

export type VbrQuality = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type CbrBitrate = 64 | 96 | 128 | 160 | 192 | 256 | 320;

export interface AudioFileInfo {
  file: File;
  name: string;
  size: number;
  duration: number;
  sampleRate: number;
  channels: number;
  audioBuffer?: AudioBuffer;
  objectUrl?: string;
}

export type FileStatus = 'idle' | 'decoding' | 'converting' | 'completed' | 'error';

export interface BatchItem {
  id: string;
  file: File;
  name: string;
  size: number;
  duration?: number;
  sampleRate?: number;
  channels?: number;
  audioBuffer?: AudioBuffer;
  objectUrl?: string;
  status: FileStatus;
  progressPercentage: number;
  outputFileName: string;
  result?: ConvertedResult;
  errorMessage?: string;
  savedToFolder?: boolean;
  savedPath?: string;
}

export interface ConversionProgress {
  percentage: number;
  currentChunk: number;
  totalChunks: number;
  elapsedSeconds: number;
  estimatedRemainingSeconds: number;
  conversionSpeed: number;
}

export interface ConvertedResult {
  blob: Blob;
  url: string;
  size: number;
  fileName: string;
  conversionTimeMs: number;
  compressionRatio: number;
}
