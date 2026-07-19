import { DetectionHistory, DetectionType } from '../models/DetectionHistory';

export interface SaveDetectionInput {
  session: string;
  type: DetectionType;
  durationMs: number;
  averageEar: number;
  minEar: number;
  blinkCount: number;
  alarmTriggered: boolean;
  screenshot?: string;
  startedAt: Date;
}

export async function saveDetection(userId: string, input: SaveDetectionInput) {
  return DetectionHistory.create({ user: userId, ...input });
}

export async function getHistory(
  userId: string,
  page: number,
  limit: number,
  type?: DetectionType
) {
  const filter: Record<string, unknown> = { user: userId };
  if (type) filter.type = type;

  const [items, total] = await Promise.all([
    DetectionHistory.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    DetectionHistory.countDocuments(filter),
  ]);

  return {
    items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

export async function clearHistory(userId: string, ids?: string[]) {
  const filter: Record<string, unknown> = { user: userId };
  if (ids && ids.length) {
    filter._id = { $in: ids };
  }
  const result = await DetectionHistory.deleteMany(filter);
  return result.deletedCount ?? 0;
}

export async function getStats(userId: string, range: 'day' | 'week' | 'month') {
  const now = new Date();
  const since = new Date(now);
  if (range === 'day') since.setDate(now.getDate() - 1);
  if (range === 'week') since.setDate(now.getDate() - 7);
  if (range === 'month') since.setMonth(now.getMonth() - 1);

  const events = await DetectionHistory.find({
    user: userId,
    createdAt: { $gte: since },
  }).lean();

  const totalEvents = events.length;
  const sleepEvents = events.filter((e) => e.type === 'sleep').length;
  const totalBlinks = events.reduce((sum, e) => sum + (e.blinkCount || 0), 0);
  const totalClosedMs = events.reduce((sum, e) => sum + e.durationMs, 0);
  const avgEar =
    totalEvents > 0 ? events.reduce((sum, e) => sum + e.averageEar, 0) / totalEvents : 0;

  // Bucket events per day for the chart.
  const buckets = new Map<string, { date: string; sleep: number; drowsy: number; blink: number }>();
  for (const e of events) {
    const key = new Date(e.createdAt).toISOString().slice(0, 10);
    const bucket = buckets.get(key) ?? { date: key, sleep: 0, drowsy: 0, blink: 0 };
    bucket[e.type] += 1;
    buckets.set(key, bucket);
  }
  const timeline = Array.from(buckets.values()).sort((a, b) => a.date.localeCompare(b.date));

  return {
    range,
    totalEvents,
    sleepEvents,
    totalBlinks,
    totalClosedMs,
    averageEar: Number(avgEar.toFixed(3)),
    timeline,
  };
}
