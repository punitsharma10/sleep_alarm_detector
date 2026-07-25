import { DetectionSession, SessionActivity } from '../models/DetectionSession';
import { DetectionHistory } from '../models/DetectionHistory';
import { ApiError } from '../utils/ApiError';

export interface StartSessionInput {
  label?: string;
  activity?: SessionActivity;
  notes?: string;
  alertnessBefore?: number;
}

function defaultLabel(): string {
  // Human-friendly default; the client may also pass its own label.
  const now = new Date();
  const date = now.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const time = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  return `Session · ${date}, ${time}`;
}

export async function startSession(userId: string, input: StartSessionInput) {
  return DetectionSession.create({
    user: userId,
    label: input.label?.trim() || defaultLabel(),
    activity: input.activity ?? 'other',
    notes: input.notes,
    alertnessBefore: input.alertnessBefore,
    status: 'active',
    startedAt: new Date(),
  });
}

/** Finalize a session: aggregate its events into rolled-up stats. */
export async function endSession(userId: string, sessionId: string, blinkCount?: number) {
  const session = await DetectionSession.findOne({ _id: sessionId, user: userId });
  if (!session) throw ApiError.notFound('Session not found');
  if (session.status === 'completed') return session;

  const events = await DetectionHistory.find({ session: session._id }).lean();
  const endedAt = new Date();

  const drowsy = events.filter((e) => e.type === 'drowsy');
  const sleep = events.filter((e) => e.type === 'sleep');
  const alarms = events.filter((e) => e.alarmTriggered);
  const ears = events.map((e) => e.averageEar).filter((n) => Number.isFinite(n));

  session.status = 'completed';
  session.endedAt = endedAt;
  session.durationMs = endedAt.getTime() - session.startedAt.getTime();
  session.totalEvents = events.length;
  session.drowsyCount = drowsy.length;
  session.sleepCount = sleep.length;
  session.alarmCount = alarms.length;
  session.blinkCount = blinkCount ?? session.blinkCount;
  session.averageEar = ears.length ? Number((ears.reduce((a, b) => a + b, 0) / ears.length).toFixed(3)) : 0;
  session.minEar = ears.length ? Number(Math.min(...ears).toFixed(3)) : 0;
  session.totalClosedMs = events.reduce((sum, e) => sum + (e.durationMs || 0), 0);

  await session.save();
  return session;
}

export async function listSessions(userId: string, page: number, limit: number) {
  const filter = { user: userId };
  const [items, total] = await Promise.all([
    DetectionSession.find(filter)
      .sort({ startedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    DetectionSession.countDocuments(filter),
  ]);
  return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

export async function getSession(userId: string, sessionId: string) {
  const session = await DetectionSession.findOne({ _id: sessionId, user: userId }).lean();
  if (!session) throw ApiError.notFound('Session not found');
  const events = await DetectionHistory.find({ session: session._id }).sort({ createdAt: 1 }).lean();
  return { session, events };
}

/** Delete sessions (and their events). Pass ids to delete a subset, or omit for all. */
export async function deleteSessions(userId: string, ids?: string[]) {
  const sessionFilter: Record<string, unknown> = { user: userId };
  if (ids && ids.length) sessionFilter._id = { $in: ids };

  const sessions = await DetectionSession.find(sessionFilter).select('_id').lean();
  const sessionIds = sessions.map((s) => s._id);

  await DetectionHistory.deleteMany({ session: { $in: sessionIds } });
  const result = await DetectionSession.deleteMany(sessionFilter);
  return result.deletedCount ?? 0;
}
