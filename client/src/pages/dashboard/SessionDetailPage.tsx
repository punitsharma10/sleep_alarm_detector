import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Activity,
  AlarmClock,
  Eye,
  Timer,
  Inbox,
  Image as ImageIcon,
  Clock,
} from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { StatCard } from '@/components/dashboard/StatCard';
import { getSession } from '@/services/session.service';
import { formatDate, formatDuration, cn } from '@/lib/utils';
import type { DetectionType, SessionActivity } from '@/types';

const typeStyles: Record<DetectionType, string> = {
  blink: 'bg-brand-500/10 text-brand-500',
  drowsy: 'bg-amber-500/10 text-amber-500',
  sleep: 'bg-red-500/10 text-red-500',
};

const ACTIVITY_LABELS: Record<SessionActivity, string> = {
  driving: 'Driving',
  studying: 'Studying',
  working: 'Working',
  operating: 'Operating',
  other: 'Other',
};

const ALERTNESS_EMOJI = ['', '😴', '🥱', '😐', '🙂', '😃'];

export default function SessionDetailPage() {
  const { id = '' } = useParams();
  const [preview, setPreview] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['session', id],
    queryFn: () => getSession(id),
  });

  return (
    <div className="space-y-6">
      <Link to="/app/history" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-500 dark:text-slate-400">
        <ArrowLeft className="h-4 w-4" /> Back to sessions
      </Link>

      {isLoading ? (
        <Skeleton className="h-40 rounded-2xl" />
      ) : error || !data ? (
        <Card><EmptyState icon={Inbox} title="Session not found" /></Card>
      ) : (
        <>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{data.session.label}</h1>
              <span className={cn('rounded-lg px-2 py-1 text-xs font-semibold capitalize', data.session.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500')}>
                {data.session.status}
              </span>
            </div>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
              <span>{ACTIVITY_LABELS[data.session.activity]}</span>
              <span>· {formatDate(data.session.startedAt)}</span>
              {data.session.alertnessBefore && (
                <span>· Alertness before {ALERTNESS_EMOJI[data.session.alertnessBefore]}</span>
              )}
            </p>
            {data.session.notes && (
              <p className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300">
                {data.session.notes}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={Clock} label="Duration" value={data.session.durationMs ? formatDuration(data.session.durationMs) : '—'} />
            <StatCard icon={AlarmClock} label="Sleep alarms" value={data.session.alarmCount} accent="red" />
            <StatCard icon={Activity} label="Drowsy events" value={data.session.drowsyCount} accent="amber" />
            <StatCard icon={Eye} label="Avg EAR" value={data.session.averageEar ? data.session.averageEar.toFixed(3) : '—'} accent="emerald" />
          </div>

          <Card className="overflow-hidden p-0">
            <div className="border-b border-slate-200 px-6 py-4 dark:border-white/10">
              <CardTitle>Events ({data.events.length})</CardTitle>
            </div>
            {data.events.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-white/10 dark:text-slate-400">
                    <tr>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Time</th>
                      <th className="px-4 py-3">Duration</th>
                      <th className="px-4 py-3">Avg EAR</th>
                      <th className="px-4 py-3">Alarm</th>
                      <th className="px-4 py-3">Shot</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.events.map((e) => (
                      <tr key={e._id} className="border-b border-slate-100 last:border-0 dark:border-white/5">
                        <td className="px-4 py-3"><span className={cn('rounded-lg px-2 py-1 text-xs font-semibold capitalize', typeStyles[e.type])}>{e.type}</span></td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{formatDate(e.createdAt)}</td>
                        <td className="px-4 py-3 font-medium"><span className="inline-flex items-center gap-1"><Timer className="h-3.5 w-3.5 text-slate-400" />{formatDuration(e.durationMs)}</span></td>
                        <td className="px-4 py-3 tabular-nums">{e.averageEar.toFixed(3)}</td>
                        <td className="px-4 py-3">{e.alarmTriggered ? <span className="text-red-500">Yes</span> : <span className="text-slate-400">No</span>}</td>
                        <td className="px-4 py-3">
                          {e.screenshot ? (
                            <button onClick={() => setPreview(e.screenshot!)} className="text-brand-500 hover:text-brand-400"><ImageIcon className="h-4 w-4" /></button>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState icon={Inbox} title="No events" description="No drowsiness events were recorded in this session — nicely alert!" />
            )}
          </Card>
        </>
      )}

      {preview && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={() => setPreview(null)}>
          <img src={preview} alt="Detection screenshot" className="max-h-[80vh] rounded-2xl border border-white/10" />
        </div>
      )}
    </div>
  );
}
