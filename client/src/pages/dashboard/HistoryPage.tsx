import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Trash2, ChevronLeft, ChevronRight, Inbox, ScanFace, AlarmClock } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { getSessions, deleteSessions } from '@/services/session.service';
import { formatDate, formatDuration, cn } from '@/lib/utils';
import { useConfirm } from '@/context/ConfirmContext';
import type { SessionActivity } from '@/types';

const ACTIVITY_LABELS: Record<SessionActivity, string> = {
  driving: 'Driving',
  studying: 'Studying',
  working: 'Working',
  operating: 'Operating',
  other: 'Other',
};

export default function HistoryPage() {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ['sessions', page],
    queryFn: () => getSessions(page, 20),
  });

  const items = data?.items ?? [];
  const pagination = data?.pagination;
  const hasData = (pagination?.total ?? 0) > 0;
  const pageIds = items.map((s) => s._id);
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const someSelected = pageIds.some((id) => selected.has(id));

  useEffect(() => setSelected(new Set()), [page]);

  const toggleAll = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });

  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const deleteMutation = useMutation<number, Error, string[] | undefined>({
    mutationFn: (ids) => deleteSessions(ids),
    onSuccess: (deleted) => {
      toast.success(`Deleted ${deleted} session${deleted === 1 ? '' : 's'}`);
      setSelected(new Set());
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Failed to delete'),
  });

  const handleDeleteSelected = async () => {
    const count = selected.size;
    if (!count) return;
    const ok = await confirm({
      title: `Delete ${count} session${count === 1 ? '' : 's'}?`,
      description: 'This permanently removes the selected sessions and all their events.',
      confirmText: `Delete ${count}`,
      variant: 'danger',
    });
    if (ok) deleteMutation.mutate([...selected]);
  };

  const handleDeleteAll = async () => {
    if (!hasData) return;
    const ok = await confirm({
      title: 'Delete all sessions?',
      description: `This permanently deletes all ${pagination?.total ?? ''} sessions and their events.`,
      confirmText: 'Delete all',
      cancelText: 'Keep history',
      variant: 'danger',
    });
    if (ok) deleteMutation.mutate(undefined);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Session History</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Each monitoring session and its recorded events.</p>
        </div>
        <Button variant="danger" onClick={handleDeleteAll} loading={deleteMutation.isPending && selected.size === 0} disabled={!hasData || isLoading} className="gap-2">
          <Trash2 className="h-4 w-4" /> Delete all
        </Button>
      </div>

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-500/30 bg-brand-500/10 px-4 py-2.5">
          <span className="text-sm font-semibold text-brand-600 dark:text-brand-300">{selected.size} selected</span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
            <Button size="sm" variant="danger" onClick={handleDeleteSelected} loading={deleteMutation.isPending && selected.size > 0} className="gap-1.5">
              <Trash2 className="h-3.5 w-3.5" /> Delete selected
            </Button>
          </div>
        </div>
      )}

      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <div className="space-y-2 p-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
        ) : items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-white/10 dark:text-slate-400">
                <tr>
                  <th className="w-12 px-4 py-3">
                    <Checkbox checked={allSelected} indeterminate={someSelected && !allSelected} onChange={toggleAll} aria-label="Select all" />
                  </th>
                  <th className="px-4 py-3">Session</th>
                  <th className="px-4 py-3">Activity</th>
                  <th className="px-4 py-3">Started</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Alarms</th>
                  <th className="px-4 py-3">Avg EAR</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((sess) => {
                  const isSel = selected.has(sess._id);
                  return (
                    <tr
                      key={sess._id}
                      className={cn('cursor-pointer border-b border-slate-100 transition last:border-0 dark:border-white/5', isSel ? 'bg-brand-500/[0.07]' : 'hover:bg-slate-50 dark:hover:bg-white/[0.03]')}
                      onClick={() => navigate(`/app/history/${sess._id}`)}
                    >
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <Checkbox checked={isSel} onChange={() => toggleOne(sess._id)} aria-label="Select session" />
                      </td>
                      <td className="px-4 py-3 font-medium">{sess.label}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{ACTIVITY_LABELS[sess.activity]}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{formatDate(sess.startedAt)}</td>
                      <td className="px-4 py-3">{sess.durationMs ? formatDuration(sess.durationMs) : '—'}</td>
                      <td className="px-4 py-3">
                        {sess.alarmCount > 0 ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-red-500"><AlarmClock className="h-3.5 w-3.5" /> {sess.alarmCount}</span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500">0</span>
                        )}
                      </td>
                      <td className="px-4 py-3 tabular-nums">{sess.averageEar ? sess.averageEar.toFixed(3) : '—'}</td>
                      <td className="px-4 py-3">
                        <span className={cn('rounded-lg px-2 py-1 text-xs font-semibold capitalize', sess.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500')}>
                          {sess.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={Inbox}
            title="No sessions yet"
            description="Start a monitoring session and it will appear here with all its events grouped together."
            action={
              <Button onClick={() => navigate('/app/detection')} className="gap-2">
                <ScanFace className="h-4 w-4" /> Start detection
              </Button>
            }
          />
        )}
      </Card>

      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500 dark:text-slate-400">Page {pagination.page} of {pagination.pages} · {pagination.total} sessions</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" disabled={page >= pagination.pages} onClick={() => setPage((p) => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}
    </div>
  );
}
