import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Activity, AlarmClock, Eye, Timer, BarChart3 } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { getStats } from '@/services/detection.service';
import { formatDuration, cn } from '@/lib/utils';
import { chartTooltip } from '@/lib/chartTheme';

type Range = 'day' | 'week' | 'month';
const ranges: { key: Range; label: string }[] = [
  { key: 'day', label: 'Day' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
];

const PIE_COLORS = ['#ef4444', '#f59e0b', '#3282ff'];

export default function AnalyticsPage() {
  const [range, setRange] = useState<Range>('week');
  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats', range],
    queryFn: () => getStats(range),
  });

  const pieData = stats
    ? [
        { name: 'Sleep', value: stats.sleepEvents },
        { name: 'Drowsy', value: Math.max(0, stats.totalEvents - stats.sleepEvents) },
        { name: 'Blinks', value: stats.totalBlinks },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Trends and aggregated statistics.</p>
        </div>
        <div className="inline-flex rounded-xl border border-slate-200 p-1 dark:border-white/10">
          {ranges.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={cn(
                'rounded-lg px-4 py-1.5 text-sm font-medium transition',
                range === r.key
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Activity} label="Total events" value={stats?.totalEvents ?? 0} />
          <StatCard icon={AlarmClock} label="Sleep alarms" value={stats?.sleepEvents ?? 0} accent="red" />
          <StatCard icon={Eye} label="Total blinks" value={stats?.totalBlinks ?? 0} accent="emerald" />
          <StatCard icon={Timer} label="Eyes closed" value={formatDuration(stats?.totalClosedMs ?? 0)} accent="amber" />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Events over time</CardTitle>
          </CardHeader>
          <div className="h-72">
            {stats && stats.timeline.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.timeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <Tooltip {...chartTooltip} />
                  <Legend />
                  <Bar dataKey="sleep" stackId="a" fill="#ef4444" name="Sleep" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="drowsy" stackId="a" fill="#f59e0b" name="Drowsy" />
                  <Bar dataKey="blink" stackId="a" fill="#3282ff" name="Blink" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState
                className="h-full"
                icon={BarChart3}
                title="No data yet"
                description="There are no detection events in this range. Run a session to see analytics here."
              />
            )}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Event distribution</CardTitle>
          </CardHeader>
          <div className="h-72">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip {...chartTooltip} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState
                className="h-full"
                icon={BarChart3}
                title="No data yet"
                description="There are no detection events in this range. Run a session to see analytics here."
              />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
