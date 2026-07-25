import { api } from './api';
import type { DetectionSession, SessionActivity, SessionsResponse, DetectionEvent } from '@/types';

export interface StartSessionPayload {
  label?: string;
  activity?: SessionActivity;
  notes?: string;
  alertnessBefore?: number;
}

export async function startSession(payload: StartSessionPayload): Promise<DetectionSession> {
  const { data } = await api.post<{ session: DetectionSession }>('/detection/sessions', payload);
  return data.session;
}

export async function endSession(id: string, blinkCount?: number): Promise<DetectionSession> {
  const { data } = await api.patch<{ session: DetectionSession }>(
    `/detection/sessions/${id}/end`,
    { blinkCount }
  );
  return data.session;
}

export async function getSessions(page = 1, limit = 20): Promise<SessionsResponse> {
  const { data } = await api.get<SessionsResponse>('/detection/sessions', {
    params: { page, limit },
  });
  return data;
}

export async function getSession(
  id: string
): Promise<{ session: DetectionSession; events: DetectionEvent[] }> {
  const { data } = await api.get<{ session: DetectionSession; events: DetectionEvent[] }>(
    `/detection/sessions/${id}`
  );
  return { session: data.session, events: data.events };
}

export async function deleteSessions(ids?: string[]): Promise<number> {
  const { data } = await api.delete<{ deleted: number }>('/detection/sessions', {
    data: ids && ids.length ? { ids } : {},
  });
  return data.deleted;
}
