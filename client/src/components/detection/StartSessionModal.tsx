import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Settings as SettingsIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import type { SessionActivity, UserSettings } from '@/types';
import type { CameraDevice } from '@/hooks/useCamera';
import type { StartSessionPayload } from '@/services/session.service';

const ACTIVITIES: { value: SessionActivity; label: string }[] = [
  { value: 'driving', label: 'Driving' },
  { value: 'studying', label: 'Studying' },
  { value: 'working', label: 'Working' },
  { value: 'operating', label: 'Operating machinery' },
  { value: 'other', label: 'Other' },
];

const ALERTNESS = [
  { v: 1, e: '😴', l: 'Exhausted' },
  { v: 2, e: '🥱', l: 'Tired' },
  { v: 3, e: '😐', l: 'Okay' },
  { v: 4, e: '🙂', l: 'Fresh' },
  { v: 5, e: '😃', l: 'Wide awake' },
];

interface Props {
  open: boolean;
  starting?: boolean;
  settings?: UserSettings;
  devices: CameraDevice[];
  cameraId?: string;
  onCameraChange: (id?: string) => void;
  onClose: () => void;
  onStart: (payload: StartSessionPayload) => void;
}

function defaultLabel() {
  const now = new Date();
  return `Session · ${now.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}, ${now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
}

export function StartSessionModal({
  open,
  starting,
  settings,
  devices,
  cameraId,
  onCameraChange,
  onClose,
  onStart,
}: Props) {
  const [label, setLabel] = useState('');
  const [activity, setActivity] = useState<SessionActivity>('driving');
  const [alertness, setAlertness] = useState<number | undefined>(undefined);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open) {
      setLabel('');
      setActivity('driving');
      setAlertness(undefined);
      setNotes('');
    }
  }, [open]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onStart({
      label: label.trim() || defaultLabel(),
      activity,
      alertnessBefore: alertness,
      notes: notes.trim() || undefined,
    });
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
          <motion.form
            onSubmit={submit}
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', duration: 0.3, bounce: 0.2 }}
            className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#0f172a]"
          >
            <button type="button" onClick={onClose} aria-label="Close" className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5">
              <X className="h-4 w-4" />
            </button>
            <h2 className="text-lg font-bold">Start a monitoring session</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              A few quick details (all optional) — then we'll begin watching for drowsiness.
            </p>

            <div className="mt-5 space-y-5">
              <div>
                <label className="label">Session label</label>
                <input className="input" placeholder={defaultLabel()} value={label} onChange={(e) => setLabel(e.target.value)} />
              </div>

              <div>
                <label className="label">Activity</label>
                <div className="flex flex-wrap gap-2">
                  {ACTIVITIES.map((a) => (
                    <button
                      key={a.value}
                      type="button"
                      onClick={() => setActivity(a.value)}
                      className={`rounded-xl border px-3 py-1.5 text-sm font-medium transition ${
                        activity === a.value ? 'border-brand-500 bg-brand-500/10 text-brand-500' : 'border-slate-200 dark:border-white/10'
                      }`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">How alert do you feel right now?</label>
                <div className="flex justify-between gap-2">
                  {ALERTNESS.map((a) => (
                    <button
                      key={a.v}
                      type="button"
                      title={a.l}
                      onClick={() => setAlertness(alertness === a.v ? undefined : a.v)}
                      className={`flex flex-1 flex-col items-center gap-1 rounded-xl border py-2 transition ${
                        alertness === a.v ? 'border-brand-500 bg-brand-500/10' : 'border-slate-200 dark:border-white/10'
                      }`}
                    >
                      <span className="text-xl">{a.e}</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">{a.l}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label flex items-center gap-2"><Camera className="h-4 w-4" /> Camera</label>
                <select className="input" value={cameraId ?? ''} onChange={(e) => onCameraChange(e.target.value || undefined)}>
                  <option value="">Default camera</option>
                  {devices.map((d) => <option key={d.deviceId} value={d.deviceId}>{d.label}</option>)}
                </select>
              </div>

              <div>
                <label className="label">Notes (optional)</label>
                <textarea className="input min-h-[64px]" placeholder="Anything worth noting…" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>

              {settings && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-400">
                  <div className="flex items-center justify-between">
                    <span>
                      Alarm fires after <strong className="text-slate-700 dark:text-slate-200">{settings.alarmDelay}s</strong> of closed eyes ·
                      EAR threshold <strong className="text-slate-700 dark:text-slate-200">{settings.earThreshold}</strong>
                    </span>
                    <Link to="/app/settings" className="flex items-center gap-1 text-brand-500 hover:underline">
                      <SettingsIcon className="h-3.5 w-3.5" /> Adjust
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" loading={starting}>Start monitoring</Button>
            </div>
          </motion.form>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
