import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Save, Mail, User as UserIcon, Calendar, BadgeCheck } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { formatDate } from '@/lib/utils';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name ?? '');

  const mutation = useMutation({
    mutationFn: async (newName: string) => {
      const { data } = await api.put('/user/profile', { name: newName });
      return data.user as { name: string };
    },
    onSuccess: (u) => {
      updateUser({ name: u.name });
      toast.success('Profile updated');
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Update failed'),
  });

  const isOwner = (user?.level ?? 0) >= 10;
  const roleLabel = `${user?.designation ?? 'User'}${isOwner ? '' : ` · Level ${user?.level}`}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Manage your personal information.</p>
      </div>

      <Card>
        {/* Header: avatar + name + role (no duplicated fields below) */}
        <div className="flex items-center gap-4 border-b border-slate-200 pb-5 dark:border-white/10">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-2xl font-bold text-white">
            {user?.name?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold">{user?.name}</h2>
            <span className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-brand-500/10 px-2 py-0.5 text-xs font-semibold text-brand-500">
              <BadgeCheck className="h-3.5 w-3.5" /> {roleLabel}
            </span>
          </div>
        </div>

        <CardHeader className="mt-5">
          <CardTitle>Account details</CardTitle>
        </CardHeader>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Full name</label>
              <div className="relative">
                <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input className="input pl-9" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input className="input pl-9 opacity-70" value={user?.email ?? ''} disabled />
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Email cannot be changed.</p>
            </div>
          </div>
          {user?.createdAt && (
            <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Calendar className="h-3.5 w-3.5" /> Joined {formatDate(user.createdAt)}
            </p>
          )}
          <div className="flex justify-end">
            <Button
              onClick={() => mutation.mutate(name)}
              loading={mutation.isPending}
              disabled={!name.trim() || name === user?.name}
              className="gap-2"
            >
              <Save className="h-4 w-4" /> Save
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
