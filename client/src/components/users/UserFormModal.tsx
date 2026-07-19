import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { maxAssignableLevel } from '@/lib/permissions';
import { PERMISSION_LABELS, MODULES } from '@/lib/constants';
import { isStrongPassword, PASSWORD_HINT } from '@/lib/validators';
import type { ManagedUser, Permissions, ModuleAccess, User, PermissionAction, ModuleKey } from '@/types';

const DESIGNATIONS = ['User', 'Driver', 'Supervisor', 'Operator', 'Manager'];

export interface UserFormValues {
  name: string;
  email: string;
  password: string;
  designation: string;
  level: number;
  permissions: Permissions;
  modules: ModuleAccess;
  status: 'active' | 'inactive';
}

interface Props {
  open: boolean;
  mode: 'create' | 'edit';
  actor: User;
  initial?: ManagedUser | null;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (values: UserFormValues) => void;
}

const emptyPerms = (): Permissions => ({ create: false, view: false, edit: false, delete: false });
const emptyModules = (): ModuleAccess => ({
  dashboard: false,
  liveDetection: false,
  history: false,
  analytics: false,
  users: false,
  settings: false,
  profile: false,
});

const Req = () => <span className="text-red-500">*</span>;

export function UserFormModal({ open, mode, actor, initial, submitting, onClose, onSubmit }: Props) {
  const maxLevel = maxAssignableLevel(actor);
  const [values, setValues] = useState<UserFormValues>({
    name: '',
    email: '',
    password: '',
    designation: '',
    level: 1,
    permissions: emptyPerms(),
    modules: emptyModules(),
    status: 'active',
  });

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && initial) {
      setValues({
        name: initial.name,
        email: initial.email,
        password: '',
        designation: initial.designation,
        level: initial.level,
        permissions: { ...initial.permissions },
        modules: { ...initial.modules },
        status: initial.status,
      });
    } else {
      setValues({
        name: '',
        email: '',
        password: '',
        designation: '',
        level: Math.min(1, maxLevel),
        permissions: emptyPerms(),
        modules: emptyModules(),
        status: 'active',
      });
    }
  }, [open, mode, initial, maxLevel]);

  const set = <K extends keyof UserFormValues>(k: K, v: UserFormValues[K]) =>
    setValues((prev) => ({ ...prev, [k]: v }));

  const togglePerm = (p: PermissionAction) =>
    setValues((prev) => ({ ...prev, permissions: { ...prev.permissions, [p]: !prev.permissions[p] } }));

  const toggleModule = (m: ModuleKey) =>
    setValues((prev) => ({ ...prev, modules: { ...prev.modules, [m]: !prev.modules[m] } }));

  const levelOptions = Array.from({ length: maxLevel }, (_, i) => i + 1);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.designation) {
      toast.error('Please select a designation');
      return;
    }
    if (mode === 'create' && !isStrongPassword(values.password)) {
      toast.error(PASSWORD_HINT);
      return;
    }
    if (mode === 'edit' && values.password && !isStrongPassword(values.password)) {
      toast.error(PASSWORD_HINT);
      return;
    }
    // User-management permissions only matter if they have the Users page.
    const permissions = values.modules.users ? values.permissions : emptyPerms();
    onSubmit({ ...values, permissions });
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.form
            onSubmit={submit}
            autoComplete="off"
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', duration: 0.3, bounce: 0.2 }}
            className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#0f172a]"
          >
            <button type="button" onClick={onClose} aria-label="Close" className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5">
              <X className="h-4 w-4" />
            </button>
            <h2 className="text-lg font-bold">{mode === 'create' ? 'Create user' : 'Edit user'}</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              You can assign level 1–{maxLevel} and grant only permissions you hold.
            </p>

            <div className="mt-5 space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Full name <Req /></label>
                  <input className="input" required autoComplete="off" value={values.name} onChange={(e) => set('name', e.target.value)} />
                </div>
                <div>
                  <label className="label">Designation <Req /></label>
                  <select className="input" required value={values.designation} onChange={(e) => set('designation', e.target.value)}>
                    <option value="">Select</option>
                    {DESIGNATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Email <Req /> {mode === 'edit' && <span className="text-slate-400">(cannot change)</span>}</label>
                <input
                  className="input disabled:opacity-60"
                  type="email"
                  required
                  autoComplete="off"
                  disabled={mode === 'edit'}
                  value={values.email}
                  onChange={(e) => set('email', e.target.value)}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">
                    Password {mode === 'create' ? <Req /> : <span className="text-slate-400">(leave blank to keep)</span>}
                  </label>
                  <PasswordInput
                    leftIcon={null}
                    autoComplete="new-password"
                    required={mode === 'create'}
                    placeholder={mode === 'edit' ? '••••••••' : 'Strong password'}
                    value={values.password}
                    onChange={(e) => set('password', e.target.value)}
                  />
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{PASSWORD_HINT}</p>
                </div>
                <div>
                  <label className="label">Level <Req /></label>
                  <select className="input" value={values.level} onChange={(e) => set('level', Number(e.target.value))}>
                    {levelOptions.map((l) => <option key={l} value={l}>Level {l}</option>)}
                  </select>
                </div>
              </div>

              {/* Page access */}
              <div>
                <label className="label">Page access</label>
                <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">Which pages this user sees in their sidebar.</p>
                <div className="grid grid-cols-2 gap-2">
                  {MODULES.map((m) => (
                    <button
                      type="button"
                      key={m.key}
                      onClick={() => toggleModule(m.key)}
                      className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm font-medium transition ${
                        values.modules[m.key]
                          ? 'border-brand-500 bg-brand-500/10 text-brand-500'
                          : 'border-slate-200 dark:border-white/10'
                      }`}
                    >
                      {m.label}
                      <span className={`h-2 w-2 rounded-full ${values.modules[m.key] ? 'bg-brand-500' : 'bg-slate-300 dark:bg-white/20'}`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* User-management permissions (only meaningful with Users page) */}
              {values.modules.users && (
                <div>
                  <label className="label">User management permissions</label>
                  <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
                    What this user can do on the Users page (for users below their level).
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(PERMISSION_LABELS) as PermissionAction[]).map((p) => {
                      const allowed = actor.permissions[p];
                      return (
                        <button
                          type="button"
                          key={p}
                          disabled={!allowed}
                          onClick={() => togglePerm(p)}
                          className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
                            values.permissions[p]
                              ? 'border-brand-500 bg-brand-500/10 text-brand-500'
                              : 'border-slate-200 dark:border-white/10'
                          }`}
                        >
                          {PERMISSION_LABELS[p]}
                          <span className={`h-2 w-2 rounded-full ${values.permissions[p] ? 'bg-brand-500' : 'bg-slate-300 dark:bg-white/20'}`} />
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                    Greyed-out permissions are ones you don't have, so you can't grant them.
                  </p>
                </div>
              )}

              {mode === 'edit' && (
                <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5 dark:border-white/10">
                  <span className="text-sm font-medium">Active (can log in)</span>
                  <button
                    type="button"
                    onClick={() => set('status', values.status === 'active' ? 'inactive' : 'active')}
                    className={`relative h-6 w-11 rounded-full transition ${values.status === 'active' ? 'bg-brand-600' : 'bg-slate-300 dark:bg-white/15'}`}
                  >
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${values.status === 'active' ? 'left-[22px]' : 'left-0.5'}`} />
                  </button>
                </label>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" loading={submitting}>{mode === 'create' ? 'Create user' : 'Save changes'}</Button>
            </div>
          </motion.form>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
