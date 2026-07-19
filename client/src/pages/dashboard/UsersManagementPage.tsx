import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { UserPlus, Eye, Pencil, Trash2, Users as UsersIcon } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { UserFormModal, type UserFormValues } from '@/components/users/UserFormModal';
import {
  getManagedUsers,
  createManagedUser,
  updateManagedUser,
  deactivateManagedUser,
} from '@/services/users.service';
import { useAuth } from '@/context/AuthContext';
import { useConfirm } from '@/context/ConfirmContext';
import { canActOn } from '@/lib/permissions';
import { PERMISSION_ORDER } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { ManagedUser } from '@/types';

export default function UsersManagementPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const queryClient = useQueryClient();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ManagedUser | null>(null);

  const { data: users, isLoading } = useQuery({
    queryKey: ['managed-users'],
    queryFn: getManagedUsers,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['managed-users'] });

  const createMutation = useMutation({
    mutationFn: createManagedUser,
    onSuccess: () => {
      toast.success('User created');
      setModalOpen(false);
      invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Failed to create'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<UserFormValues> }) =>
      updateManagedUser(id, payload),
    onSuccess: () => {
      toast.success('User updated');
      setModalOpen(false);
      setEditing(null);
      invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Failed to update'),
  });

  const deactivateMutation = useMutation({
    mutationFn: deactivateManagedUser,
    onSuccess: () => {
      toast.success('User removed (deactivated)');
      invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Failed'),
  });

  if (!user) return null;

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (u: ManagedUser) => {
    setEditing(u);
    setModalOpen(true);
  };

  const handleSubmit = (values: UserFormValues) => {
    if (editing) {
      const payload: Partial<UserFormValues> = {
        name: values.name,
        designation: values.designation,
        level: values.level,
        permissions: values.permissions,
        modules: values.modules,
        status: values.status,
      };
      if (values.password) payload.password = values.password;
      updateMutation.mutate({ id: editing._id, payload });
    } else {
      createMutation.mutate({
        name: values.name,
        email: values.email,
        password: values.password,
        designation: values.designation,
        level: values.level,
        permissions: values.permissions,
        modules: values.modules,
      });
    }
  };

  const handleDelete = async (u: ManagedUser) => {
    const ok = await confirm({
      title: `Remove ${u.name}?`,
      description: 'They will be marked inactive and can no longer log in. You can reactivate them later via Edit.',
      confirmText: 'Remove user',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    if (ok) deactivateMutation.mutate(u._id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage users in your organization. You can act on users below your level (you are level {user.level}).
          </p>
        </div>
        {user.permissions.create && (
          <Button onClick={openCreate} className="gap-2">
            <UserPlus className="h-4 w-4" /> Create User
          </Button>
        )}
      </div>

      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
          </div>
        ) : users && users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-white/10 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Designation</th>
                  <th className="px-4 py-3">Level</th>
                  <th className="px-4 py-3">Permissions</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const canView = canActOn(user, u, 'view');
                  const canEdit = canActOn(user, u, 'edit');
                  const canDelete = canActOn(user, u, 'delete');
                  return (
                    <tr key={u._id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:border-white/5 dark:hover:bg-white/[0.03]">
                      <td className="px-4 py-3 font-medium">{u.name}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{u.email}</td>
                      <td className="px-4 py-3">{u.designation}</td>
                      <td className="px-4 py-3 tabular-nums">{u.level}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {PERMISSION_ORDER.filter((p) => u.permissions[p]).map((p) => (
                            <span key={p} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-500 dark:bg-white/10 dark:text-slate-300">
                              {p[0]}
                            </span>
                          ))}
                          {!PERMISSION_ORDER.some((p) => u.permissions[p]) && (
                            <span className="text-xs text-slate-400 dark:text-slate-500">none</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('rounded-lg px-2 py-1 text-xs font-semibold', u.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-400/10 text-slate-400')}>
                          {u.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            disabled={!canView}
                            onClick={() => navigate(`/app/users/${u._id}`)}
                            title="View"
                            className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-brand-500/10 hover:text-brand-500 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            disabled={!canEdit}
                            onClick={() => openEdit(u)}
                            title="Edit"
                            className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-amber-500/10 hover:text-amber-500 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            disabled={!canDelete}
                            onClick={() => handleDelete(u)}
                            title="Remove"
                            className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-red-500/10 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={UsersIcon}
            title="No users yet"
            description="Create users for your organization. They'll be able to log in with the credentials you set."
            action={user.permissions.create ? <Button onClick={openCreate} className="gap-2"><UserPlus className="h-4 w-4" /> Create User</Button> : undefined}
          />
        )}
      </Card>

      <UserFormModal
        open={modalOpen}
        mode={editing ? 'edit' : 'create'}
        actor={user}
        initial={editing}
        submitting={createMutation.isPending || updateMutation.isPending}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
