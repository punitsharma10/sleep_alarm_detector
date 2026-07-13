import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Trash2,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Inbox,
  ScanFace,
  X,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { getHistory, clearHistory } from '@/services/detection.service';
import { formatDate, formatDuration, cn } from '@/lib/utils';
import { useConfirm } from '@/context/ConfirmContext';
import type { DetectionType } from '@/types';

const typeStyles: Record<DetectionType, string> = {
  blink: 'bg-brand-500/10 text-brand-500',
  drowsy: 'bg-amber-500/10 text-amber-500',
  sleep: 'bg-red-500/10 text-red-500',
};

export default function HistoryPage() {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<DetectionType | ''>('');
  const [preview, setPreview] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ['history', page, 20, filter],
    queryFn: () => getHistory(page, 20, filter || undefined),
  });

  const items = data?.items ?? [];
  const pagination = data?.pagination;
  const hasData = (pagination?.total ?? 0) > 0;

  const pageIds = items.map((e) => e._id);
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const someSelected = pageIds.some((id) => selected.has(id));

  // Reset selection whenever the visible set changes to avoid acting on hidden rows.
  useEffect(() => {
    setSelected(new Set());
  }, [page, filter]);

  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const deleteMutation = useMutation<number, Error, string[] | undefined>({
    mutationFn: (ids) => clearHistory(ids),
    onSuccess: (deleted) => {
      toast.success(`Deleted ${deleted} event${deleted === 1 ? '' : 's'}`);
      setSelected(new Set());
      queryClient.invalidateQueries({ queryKey: ['history'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Failed to delete'),
  });

  const handleDeleteSelected = async () => {
    const count = selected.size;
    if (!count) return;
    const ok = await confirm({
      title: `Delete ${count} selected event${count === 1 ? '' : 's'}?`,
      description: 'This permanently removes the selected detection events. This action cannot be undone.',
      confirmText: `Delete ${count}`,
      cancelText: 'Cancel',
      variant: 'danger',
    });
    if (ok) deleteMutation.mutate([...selected]);
  };

  const handleDeleteAll = async () => {
    if (!hasData) return;
    const ok = await confirm({
      title: 'Delete all history?',
      description: `This permanently deletes all ${pagination?.total ?? ''} detection events. This action cannot be undone.`,
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
          <h1 className="text-2xl font-bold tracking-tight">Detection History</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Every recorded drowsiness and blink event.</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="input w-auto"
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value as DetectionType | '');
              setPage(1);
            }}
          >
            <option value="">All types</option>
            <option value="blink">Blink</option>
            <option value="drowsy">Drowsy</option>
            <option value="sleep">Sleep</option>
          </select>
          <Button
            variant="danger"
            onClick={handleDeleteAll}
            loading={deleteMutation.isPending && selected.size === 0}
            disabled={!hasData || isLoading}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" /> Delete all
          </Button>
        </div>
      </div>

      {/* Bulk-selection toolbar */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-500/30 bg-brand-500/10 px-4 py-2.5">
          <span className="text-sm font-semibold text-brand-600 dark:text-brand-300">
            {selected.size} selected
          </span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())} className="gap-1.5">
              <X className="h-3.5 w-3.5" /> Clear selection
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={handleDeleteSelected}
              loading={deleteMutation.isPending && selected.size > 0}
              className="gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete selected
            </Button>
          </div>
        </div>
      )}

      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-white/10 dark:text-slate-400">
                <tr>
                  <th className="w-12 px-4 py-3">
                    <Checkbox
                      checked={allSelected}
                      indeterminate={someSelected && !allSelected}
                      onChange={toggleAll}
                      aria-label="Select all rows"
                    />
                  </th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Avg EAR</th>
                  <th className="px-4 py-3">Blinks</th>
                  <th className="px-4 py-3">Alarm</th>
                  <th className="px-4 py-3">Shot</th>
                </tr>
              </thead>
              <tbody>
                {items.map((e) => {
                  const isSelected = selected.has(e._id);
                  return (
                    <tr
                      key={e._id}
                      className={cn(
                        'border-b border-slate-100 transition last:border-0 dark:border-white/5',
                        isSelected
                          ? 'bg-brand-500/[0.07]'
                          : 'hover:bg-slate-50 dark:hover:bg-white/[0.03]'
                      )}
                    >
                      <td className="px-4 py-3">
                        <Checkbox
                          checked={isSelected}
                          onChange={() => toggleOne(e._id)}
                          aria-label={`Select ${e.type} event`}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('rounded-lg px-2 py-1 text-xs font-semibold capitalize', typeStyles[e.type])}>
                          {e.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{formatDate(e.createdAt)}</td>
                      <td className="px-4 py-3 font-medium">{formatDuration(e.durationMs)}</td>
                      <td className="px-4 py-3 tabular-nums">{e.averageEar.toFixed(3)}</td>
                      <td className="px-4 py-3 tabular-nums">{e.blinkCount}</td>
                      <td className="px-4 py-3">
                        {e.alarmTriggered ? (
                          <span className="text-red-500">Yes</span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500">No</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {e.screenshot ? (
                          <button onClick={() => setPreview(e.screenshot!)} className="text-brand-500 hover:text-brand-400">
                            <ImageIcon className="h-4 w-4" />
                          </button>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500">—</span>
                        )}
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
            title={filter ? `No ${filter} events` : 'No events yet'}
            description={
              filter
                ? 'Try a different filter, or run a detection session to record new events.'
                : 'Run a detection session and your drowsiness and blink events will appear here.'
            }
            action={
              <Link to="/app/detection">
                <Button className="gap-2">
                  <ScanFace className="h-4 w-4" /> Start detection
                </Button>
              </Link>
            }
          />
        )}
      </Card>

      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Page {pagination.page} of {pagination.pages} · {pagination.total} events
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= pagination.pages} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={() => setPreview(null)}>
          <img src={preview} alt="Detection screenshot" className="max-h-[80vh] rounded-2xl border border-white/10" />
        </div>
      )}
    </div>
  );
}
