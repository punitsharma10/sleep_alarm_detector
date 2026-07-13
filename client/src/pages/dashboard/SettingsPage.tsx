import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Save, Play } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { updateSettings } from '@/services/detection.service';
import { AlarmEngine, type AlarmSound } from '@/lib/alarm';
import type { UserSettings } from '@/types';

const alarmSounds: { value: AlarmSound; label: string }[] = [
  { value: 'classic', label: 'Classic' },
  { value: 'siren', label: 'Siren' },
  { value: 'beep', label: 'Beep' },
  { value: 'chime', label: 'Chime' },
];

const previewEngine = new AlarmEngine();

export default function SettingsPage() {
  const { user, updateSettings: syncSettings } = useAuth();
  const { setTheme } = useTheme();
  const [form, setForm] = useState<UserSettings>(user!.settings);

  useEffect(() => {
    if (user) setForm(user.settings);
  }, [user]);

  const mutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: (settings) => {
      syncSettings(settings);
      setTheme(settings.theme);
      toast.success('Settings saved');
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Failed to save'),
  });

  const set = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const previewAlarm = () => {
    previewEngine.setVolume(form.alarmVolume);
    previewEngine.setSound(form.alarmSound as AlarmSound);
    previewEngine.start();
    window.setTimeout(() => previewEngine.stop(), 1500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Tune the detection engine, alarm and appearance.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Detection */}
        <Card>
          <CardHeader>
            <CardTitle>Detection</CardTitle>
          </CardHeader>
          <div className="space-y-5">
            <RangeField
              label="EAR threshold"
              hint="Below this value eyes are considered closed"
              min={0.1}
              max={0.4}
              step={0.01}
              value={form.earThreshold}
              onChange={(v) => set('earThreshold', v)}
              format={(v) => v.toFixed(2)}
            />
            <RangeField
              label="Alarm delay"
              hint="Seconds eyes must stay closed before the alarm"
              min={0.5}
              max={10}
              step={0.5}
              value={form.alarmDelay}
              onChange={(v) => set('alarmDelay', v)}
              format={(v) => `${v.toFixed(1)}s`}
            />
            <RangeField
              label="Frame rate"
              hint="Target processing frames per second"
              min={10}
              max={60}
              step={5}
              value={form.frameRate}
              onChange={(v) => set('frameRate', v)}
              format={(v) => `${v} fps`}
            />
          </div>
        </Card>

        {/* Alarm */}
        <Card>
          <CardHeader>
            <CardTitle>Alarm</CardTitle>
          </CardHeader>
          <div className="space-y-5">
            <div>
              <label className="label">Alarm sound</label>
              <div className="grid grid-cols-2 gap-2">
                {alarmSounds.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => set('alarmSound', s.value)}
                    className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                      form.alarmSound === s.value
                        ? 'border-brand-500 bg-brand-500/10 text-brand-500'
                        : 'border-slate-200 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <RangeField
              label="Alarm volume"
              min={0}
              max={1}
              step={0.05}
              value={form.alarmVolume}
              onChange={(v) => set('alarmVolume', v)}
              format={(v) => `${Math.round(v * 100)}%`}
            />
            <Button variant="outline" onClick={previewAlarm} className="gap-2">
              <Play className="h-4 w-4" /> Preview alarm
            </Button>
          </div>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
          </CardHeader>
          <div className="space-y-5">
            <div>
              <label className="label">Theme</label>
              <div className="grid grid-cols-3 gap-2">
                {(['light', 'dark', 'system'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => set('theme', t)}
                    className={`rounded-xl border px-3 py-2 text-sm font-medium capitalize transition ${
                      form.theme === t
                        ? 'border-brand-500 bg-brand-500/10 text-brand-500'
                        : 'border-slate-200 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Language</label>
              <select className="input" value={form.language} onChange={(e) => set('language', e.target.value)}>
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
                <option value="hi">हिन्दी</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <label className="flex cursor-pointer items-center justify-between">
            <span className="text-sm">
              <span className="font-medium">Enable notifications</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">Toast alerts when drowsiness is detected</span>
            </span>
            <button
              type="button"
              onClick={() => set('notifications', !form.notifications)}
              className={`relative h-6 w-11 rounded-full transition ${form.notifications ? 'bg-brand-600' : 'bg-slate-300 dark:bg-white/15'}`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${form.notifications ? 'left-[22px]' : 'left-0.5'}`}
              />
            </button>
          </label>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => mutation.mutate(form)} loading={mutation.isPending} className="gap-2">
          <Save className="h-4 w-4" /> Save changes
        </Button>
      </div>
    </div>
  );
}

function RangeField({
  label,
  hint,
  min,
  max,
  step,
  value,
  onChange,
  format,
}: {
  label: string;
  hint?: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="label mb-0">{label}</label>
        <span className="text-sm font-semibold tabular-nums text-brand-500">{format(value)}</span>
      </div>
      {hint && <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-brand-600"
      />
    </div>
  );
}
