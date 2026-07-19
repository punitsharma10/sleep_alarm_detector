import { api } from './api';
import type {
  DetectionEvent,
  DetectionType,
  HistoryResponse,
  StatsResponse,
  UserSettings,
} from '@/types';

export interface SaveDetectionPayload {
  session: string;
  type: DetectionType;
  durationMs: number;
  averageEar: number;
  minEar?: number;
  blinkCount?: number;
  alarmTriggered?: boolean;
  screenshot?: string;
  startedAt: string;
}

export async function saveDetection(payload: SaveDetectionPayload): Promise<DetectionEvent> {
  const { data } = await api.post<{ event: DetectionEvent }>('/detection/save', payload);
  return data.event;
}

export async function getHistory(
  page = 1,
  limit = 20,
  type?: DetectionType
): Promise<HistoryResponse> {
  const { data } = await api.get<HistoryResponse>('/detection/history', {
    params: { page, limit, type },
  });
  return data;
}

/**
 * Deletes detection events. Pass an array of ids to delete just those (bulk
 * delete); omit it to clear the entire history. Always sends a JSON body so the
 * server receives a parsed object.
 */
export async function clearHistory(ids?: string[]): Promise<number> {
  const { data } = await api.delete<{ deleted: number }>('/detection/history', {
    data: ids && ids.length ? { ids } : {},
  });
  return data.deleted;
}

export async function getStats(range: 'day' | 'week' | 'month' = 'week'): Promise<StatsResponse['stats']> {
  const { data } = await api.get<StatsResponse>('/detection/stats', { params: { range } });
  return data.stats;
}

export async function updateSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
  const { data } = await api.put<{ settings: UserSettings }>('/user/settings', settings);
  return data.settings;
}
