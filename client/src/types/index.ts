export interface UserSettings {
  earThreshold: number;
  alarmDelay: number;
  alarmVolume: number;
  alarmSound: string;
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: boolean;
  cameraId?: string;
  frameRate: number;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  settings: UserSettings;
  createdAt?: string;
}

export type DetectionType = 'blink' | 'drowsy' | 'sleep';

export interface DetectionEvent {
  _id: string;
  user: string;
  type: DetectionType;
  durationMs: number;
  averageEar: number;
  minEar: number;
  blinkCount: number;
  alarmTriggered: boolean;
  screenshot?: string;
  startedAt: string;
  createdAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface HistoryResponse {
  success: boolean;
  items: DetectionEvent[];
  pagination: Pagination;
}

export interface StatsResponse {
  success: boolean;
  stats: {
    range: 'day' | 'week' | 'month';
    totalEvents: number;
    sleepEvents: number;
    totalBlinks: number;
    totalClosedMs: number;
    averageEar: number;
    timeline: { date: string; sleep: number; drowsy: number; blink: number }[];
  };
}

export interface AuthResponse {
  success: boolean;
  user: User;
  accessToken: string;
}

/** Runtime eye state produced by the detection engine. */
export type EyeState = 'open' | 'blink' | 'closed' | 'sleep' | 'no-face';

export interface DetectionFrame {
  ear: number;
  leftEar: number;
  rightEar: number;
  state: EyeState;
  fps: number;
  faceDetected: boolean;
  closedForMs: number;
}
