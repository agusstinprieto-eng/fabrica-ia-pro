export interface AnalysisResult {
  fichaTecnica: string;
  metodosYTiempos: string;
  layoutErgonomia: string;
  estrategiasAhorro: string;
  rawText: string;
}

export type UploadState = 'idle' | 'processing' | 'success' | 'error';

export interface FileData {
  base64: string;
  mimeType: string;
  previewUrl: string;
  name: string;
  selected?: boolean;
}

export interface HistoryItem {
  id: string;
  date: string;
  analysis: string; // The raw or formatted text
  images?: FileData[]; // Optional: maybe store only previews to save space
  previewImage?: string; // One main image for the list
  title: string; // Operation name or "Untitled"
}