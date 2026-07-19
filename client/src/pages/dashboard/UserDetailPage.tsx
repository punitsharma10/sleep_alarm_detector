import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Shield, Mail, BadgeCheck, Layers } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/Button';
import { getManagedUser, getManagedUserDetections } from '@/services/users.service';
import { PERMISSION_LABELS, PERMISSION_ORDER } from '@/lib/constants';
import { formatDate, formatDuration, cn } from '@/lib/utils';
import { Inbox } from 'lucide-react';
import type { DetectionType } from '@/types';

const typeStyles: Record<DetectionType, string> = {
  blink: 'bg-brand-500/10 text-brand-500',
  drowsy: 'bg-amber-500/10 text-amber-500',
  sleep: 'bg-red-500/10 text-red-500',
};

export default function UserDetailPage() {
  const { id = '' } = useParams();

  const { data: user, isLoading: loadingUser, error } = useQuery({
    queryKey: ['managed-user', id],
    queryFn: () => getManagedUser(id),
  });

  const { data: detections, isLoading: loadingDet } = useQuery({
    queryKey: ['managed-user-detections', id],
    queryFn: () => getManagedUserDetections(id, 1, 50),
    enabled: !!user,
  });

  return (
    <div className="space-y-6">
      <Link to="/app/users" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-500 dark:text-slate-400">
        <ArrowLeft className="h-4 w-4" /> Back to users
      </Link>

      {error ? (
        <Card>
          <EmptyState icon={Shield} title="Access denied" description="You don't have permission to view this user." action={<Link to="/app/users"><Button variant="outline">Back</Button></Link>} />
        </Card>
      ) : loadingUser ? (
        <Skeleton className="h-40 rounded-2xl" />
      ) : user ? (
        <>
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <div className="flex flex-col items-center text-center">
                <div className="grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-2xl font-bold text-white">
                  {user.name?.[0]?.toUpperCase()}
                </div>
                <h2 className="mt-3 text-lg font-semibold">{user.name}</h2>
                <span className="mt-1 rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500 dark:bg-white/10 dark:text-slate-300">
                  {user.designation}
                </span>
                <div className="mt-4 w-full space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400"><Mail className="h-3.5 w-3.5" /> Email</span>
                    <span className="font-medium">{user.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400"><Layers className="h-3.5 w-3.5" /> Level</span>
                    <span className="font-medium">{user.level}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400"><BadgeCheck className="h-3.5 w-3.5" /> Status</span>
                    <span className={cn('font-medium capitalize', user.status === 'active' ? 'text-emerald-500' : 'text-slate-400')}>{user.status}</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader><CardTitle>Permissions</CardTitle></CardHeader>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {PERMISSION_ORDER.map((p) => (
                  <div key={p} className={cn('rounded-xl border px-3 py-3 text-center', user.permissions[p] ? 'border-brand-500/40 bg-brand-500/10' : 'border-slate-200 dark:border-white/10')}>
                    <div className={cn('text-sm font-semibold', user.permissions[p] ? 'text-brand-500' : 'text-slate-400')}>{PERMISSION_LABELS[p]}</div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{user.permissions[p] ? 'Granted' : 'Denied'}</div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Read-only view — use the Edit action on the Users page to change these.</p>
            </Card>
          </div>

          <Card className="overflow-hidden p-0">
            <div className="border-b border-slate-200 px-6 py-4 dark:border-white/10">
              <CardTitle>Detection history</CardTitle>
            </div>
            {loadingDet ? (
              <div className="space-y-2 p-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
            ) : detections && detections.items.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-white/10 dark:text-slate-400">
                    <tr>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Duration</th>
                      <th className="px-4 py-3">Avg EAR</th>
                      <th className="px-4 py-3">Alarm</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detections.items.map((e) => (
                      <tr key={e._id} className="border-b border-slate-100 last:border-0 dark:border-white/5">
                        <td className="px-4 py-3"><span className={cn('rounded-lg px-2 py-1 text-xs font-semibold capitalize', typeStyles[e.type])}>{e.type}</span></td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{formatDate(e.createdAt)}</td>
                        <td className="px-4 py-3 font-medium">{formatDuration(e.durationMs)}</td>
                        <td className="px-4 py-3 tabular-nums">{e.averageEar.toFixed(3)}</td>
                        <td className="px-4 py-3">{e.alarmTriggered ? <span className="text-red-500">Yes</span> : <span className="text-slate-400">No</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState icon={Inbox} title="No detection data" description="This user hasn't recorded any detection sessions yet." />
            )}
          </Card>
        </>
      ) : null}
    </div>
  );
}
