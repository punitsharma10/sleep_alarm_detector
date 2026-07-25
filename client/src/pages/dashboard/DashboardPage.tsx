import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  AlarmClock,
  Eye,
  Clock,
  ScanFace,
  ArrowRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { StatCard } from '@/components/dashboard/StatCard';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { getStats } from '@/services/detection.service';
import { getSessions } from '@/services/session.service';
import { useAuth } from '@/context/AuthContext';
import { formatDate, formatDuration } from '@/lib/utils';
import { chartTooltip } from '@/lib/chartTheme';

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats', 'week'],
    queryFn: () => getStats('week'),
  });
  const { data: sessions } = useQuery({
    queryKey: ['sessions', 1],
    queryFn: () => getSessions(1, 5),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Your drowsiness detection overview for the last 7 days.</p>
        </div>
        <Link to="/app/detection">
          <Button className="gap-2">
            <ScanFace className="h-4 w-4" /> Start detection
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Activity} label="Total events" value={stats?.totalEvents ?? 0} sub="Last 7 days" />
          <StatCard icon={AlarmClock} label="Sleep alarms" value={stats?.sleepEvents ?? 0} sub="Drowsiness triggers" accent="red" />
          <StatCard icon={Eye} label="Avg EAR" value={stats?.averageEar?.toFixed(3) ?? '0.000'} sub="Eye openness" accent="emerald" />
          <StatCard icon={Clock} label="Eyes closed" value={formatDuration(stats?.totalClosedMs ?? 0)} sub="Cumulative" accent="amber" />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Detection trend</CardTitle>
          </CardHeader>
          <div className="h-64">
            {stats && stats.timeline.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.timeline}>
                  <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3282ff" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#3282ff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <Tooltip {...chartTooltip} />
                  <Area type="monotone" dataKey="sleep" stroke="#ef4444" fill="url(#grad)" name="Sleep" />
                  <Area type="monotone" dataKey="drowsy" stroke="#f59e0b" fillOpacity={0} name="Drowsy" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid h-full place-items-center text-sm text-slate-400">
                No detection data yet. Run a session to see trends.
              </div>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent sessions</CardTitle>
            <Link to="/app/history" className="text-sm font-medium text-brand-500 hover:underline">
              View all
            </Link>
          </CardHeader>
          <div className="space-y-3">
            {sessions && sessions.items.length > 0 ? (
              sessions.items.map((sess) => (
                <Link
                  key={sess._id}
                  to={`/app/history/${sess._id}`}
                  className="flex items-center justify-between rounded-lg px-1 py-1 text-sm transition hover:bg-slate-50 dark:hover:bg-white/5"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{sess.label}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{formatDate(sess.startedAt)}</p>
                  </div>
                  <span className="ml-2 shrink-0 text-xs font-semibold text-slate-500">
                    {sess.alarmCount > 0 ? `${sess.alarmCount} alarm${sess.alarmCount === 1 ? '' : 's'}` : formatDuration(sess.durationMs)}
                  </span>
                </Link>
              ))
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">No sessions recorded yet.</p>
            )}
          </div>
        </Card>
      </div>

      <Card className="flex flex-col items-start justify-between gap-4 bg-gradient-to-br from-brand-600 to-brand-800 text-white sm:flex-row sm:items-center">
        <div>
          <h3 className="text-lg font-semibold">Hey {user?.name?.split(' ')[0]}, ready for a session?</h3>
          <p className="text-sm text-brand-100">Position yourself in good lighting and start monitoring.</p>
        </div>
        <Link to="/app/detection">
          <Button className="gap-2 bg-white text-brand-700 hover:bg-brand-50">
            Launch detector <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </Card>
    </div>
  );
}
