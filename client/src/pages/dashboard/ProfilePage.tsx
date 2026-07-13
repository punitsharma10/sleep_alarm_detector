import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Save, Mail, User as UserIcon, Calendar } from 'lucide-react';
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Manage your personal information.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <div className="grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-3xl font-bold text-white">
              {user?.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <h2 className="mt-4 text-lg font-semibold">{user?.name}</h2>
            <p className="text-sm text-slate-500">{user?.email}</p>
            {user?.createdAt && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <Calendar className="h-3.5 w-3.5" /> Joined {formatDate(user.createdAt)}
              </p>
            )}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Account details</CardTitle>
          </CardHeader>
          <div className="space-y-4">
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
    </div>
  );
}
