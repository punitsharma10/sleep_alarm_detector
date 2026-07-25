import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Building2, Check, X, LogOut, Clock, ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/common/Logo';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { StatCard } from '@/components/dashboard/StatCard';
import { getOrganizations, approveOrganization, rejectOrganization } from '@/services/admin.service';
import { useAuth } from '@/context/AuthContext';
import { useConfirm } from '@/context/ConfirmContext';
import { formatDate, cn } from '@/lib/utils';
import type { OrgStatus } from '@/types';

const tabs: { key: OrgStatus | 'all'; label: string }[] = [
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'all', label: 'All' },
];

const statusStyles: Record<OrgStatus, string> = {
  pending: 'bg-amber-500/10 text-amber-500',
  approved: 'bg-emerald-500/10 text-emerald-500',
  rejected: 'bg-red-500/10 text-red-500',
};

export default function SuperAdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<OrgStatus | 'all'>('pending');

  const { data: orgs, isLoading } = useQuery({
    queryKey: ['organizations', tab],
    queryFn: () => getOrganizations(tab === 'all' ? undefined : tab),
  });

  const { data: pending } = useQuery({
    queryKey: ['organizations', 'pending'],
    queryFn: () => getOrganizations('pending'),
  });

  const approveMutation = useMutation({
    mutationFn: approveOrganization,
    onSuccess: () => {
      toast.success('Organization approved');
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Failed'),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => rejectOrganization(id),
    onSuccess: () => {
      toast.success('Organization rejected');
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Failed'),
  });

  const handleReject = async (id: string, name: string) => {
    const ok = await confirm({
      title: `Reject ${name}?`,
      description: 'The organization and its admin will not be able to log in.',
      confirmText: 'Reject',
      variant: 'danger',
    });
    if (ok) rejectMutation.mutate(id);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b1120]">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur-xl dark:border-white/10 dark:bg-[#0b1120]/80 sm:px-6">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="hidden rounded-lg bg-brand-500/10 px-2.5 py-1 text-xs font-semibold text-brand-500 sm:inline">
            Super Admin
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-sm text-slate-500 dark:text-slate-400 sm:block">{user?.email}</span>
          <ThemeToggle />
          <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Organizations</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Review and approve organization sign-up requests.</p>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <StatCard icon={Clock} label="Pending requests" value={pending?.length ?? 0} accent="amber" />
          <StatCard icon={ShieldCheck} label="Viewing" value={orgs?.length ?? 0} sub={tab} />
          <StatCard icon={Building2} label="Total members" value={(orgs ?? []).reduce((s, o) => s + (o.memberCount ?? 0), 0)} accent="emerald" />
        </div>

        <div className="mb-4 inline-flex rounded-xl border border-slate-200 p-1 dark:border-white/10">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'rounded-lg px-4 py-1.5 text-sm font-medium transition',
                tab === t.key
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <Card className="overflow-hidden p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
            </div>
          ) : orgs && orgs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-white/10 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Organization</th>
                    <th className="px-4 py-3">Admin</th>
                    <th className="px-4 py-3">Members</th>
                    <th className="px-4 py-3">Requested</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orgs.map((org) => (
                    <tr key={org._id} className="border-b border-slate-100 last:border-0 dark:border-white/5">
                      <td className="px-4 py-3 font-medium">{org.name}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                        {org.admin ? (
                          <>
                            <div>{org.admin.name}</div>
                            <div className="text-xs">{org.admin.email}</div>
                          </>
                        ) : (
                          org.email
                        )}
                      </td>
                      <td className="px-4 py-3 tabular-nums">{org.memberCount ?? 0}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{formatDate(org.createdAt)}</td>
                      <td className="px-4 py-3">
                        <span className={cn('rounded-lg px-2 py-1 text-xs font-semibold capitalize', statusStyles[org.status])}>
                          {org.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {org.status === 'pending' ? (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              onClick={() => approveMutation.mutate(org._id)}
                              loading={approveMutation.isPending}
                              className="gap-1.5"
                            >
                              <Check className="h-3.5 w-3.5" /> Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => handleReject(org._id, org.name)}
                              className="gap-1.5"
                            >
                              <X className="h-3.5 w-3.5" /> Reject
                            </Button>
                          </div>
                        ) : (
                          <div className="text-right text-xs text-slate-400 dark:text-slate-500">—</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon={Building2} title="No organizations" description={`No ${tab === 'all' ? '' : tab} organizations to show.`} />
          )}
        </Card>
      </main>
    </div>
  );
}
