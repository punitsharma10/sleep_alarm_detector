import { useCallback, useMemo, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Play,
  Square,
  Pause,
  Camera,
  Maximize,
  Volume2,
  VolumeX,
  BellOff,
  Eye,
  Timer,
  Activity,
} from 'lucide-react';
import { WebcamStage } from '@/components/detection/WebcamStage';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useCamera } from '@/hooks/useCamera';
import {
  useDrowsinessDetector,
  type DetectionEpisode,
  type DetectorSettings,
} from '@/hooks/useDrowsinessDetector';
import { useAuth } from '@/context/AuthContext';
import { saveDetection } from '@/services/detection.service';
import type { AlarmSound } from '@/lib/alarm';
import { cn } from '@/lib/utils';

export default function DetectionPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { devices, requestPermission } = useCamera();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const s = user?.settings;
  const [cameraId, setCameraId] = useState<string | undefined>(s?.cameraId);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(s?.alarmVolume ?? 0.8);

  const detectorSettings: DetectorSettings = useMemo(
    () => ({
      earThreshold: s?.earThreshold ?? 0.23,
      alarmDelay: s?.alarmDelay ?? 2.5,
      alarmVolume: muted ? 0 : volume,
      alarmSound: (s?.alarmSound as AlarmSound) ?? 'classic',
      drawMesh: true,
    }),
    [s, muted, volume]
  );

  const saveMutation = useMutation({
    mutationFn: saveDetection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['history'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });

  const handleEpisode = useCallback(
    (episode: DetectionEpisode) => {
      if (episode.type === 'sleep') {
        toast.error('Drowsiness detected — wake up!', { duration: 4000 });
      }
      saveMutation.mutate({
        type: episode.type,
        durationMs: episode.durationMs,
        averageEar: episode.averageEar,
        minEar: episode.minEar,
        blinkCount: episode.blinkCount,
        alarmTriggered: episode.alarmTriggered,
        screenshot: episode.screenshot,
        startedAt: episode.startedAt,
      });
    },
    [saveMutation]
  );

  const detector = useDrowsinessDetector({
    videoRef,
    canvasRef,
    settings: detectorSettings,
    onEpisode: handleEpisode,
  });

  const handleStart = async () => {
    const ok = await requestPermission();
    if (!ok) {
      toast.error('Camera permission denied');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: cameraId ? { deviceId: { exact: cameraId } } : { facingMode: 'user' },
        audio: false,
      });
      await detector.start(stream);
    } catch {
      toast.error('Unable to access the selected camera');
    }
  };

  const toggleFullscreen = () => {
    const el = stageRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen();
  };

  const running = detector.status === 'running';
  const paused = detector.status === 'paused';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Live Detection</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Real-time drowsiness monitoring powered by MediaPipe Face Mesh.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Stage + controls */}
        <div className="space-y-4 lg:col-span-2">
          <WebcamStage
            ref={stageRef}
            videoRef={videoRef}
            canvasRef={canvasRef}
            frame={detector.frame}
            alarmActive={detector.alarmActive}
            status={detector.status}
          />

          <div className="flex flex-wrap items-center gap-2">
            {!running && !paused ? (
              <Button onClick={handleStart} loading={detector.status === 'loading'} className="gap-2">
                <Play className="h-4 w-4" /> Start
              </Button>
            ) : (
              <Button variant="danger" onClick={detector.stop} className="gap-2">
                <Square className="h-4 w-4" /> Stop
              </Button>
            )}

            {running && (
              <Button variant="outline" onClick={detector.pause} className="gap-2">
                <Pause className="h-4 w-4" /> Pause
              </Button>
            )}
            {paused && (
              <Button variant="outline" onClick={detector.resume} className="gap-2">
                <Play className="h-4 w-4" /> Resume
              </Button>
            )}

            {detector.alarmActive && (
              <Button variant="danger" onClick={detector.muteAlarm} className="gap-2">
                <BellOff className="h-4 w-4" /> Silence alarm
              </Button>
            )}

            <Button variant="ghost" onClick={toggleFullscreen} className="gap-2">
              <Maximize className="h-4 w-4" /> Fullscreen
            </Button>

            <button
              onClick={() => setMuted((m) => !m)}
              className="ml-auto grid h-10 w-10 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5"
              aria-label={muted ? 'Unmute' : 'Mute'}
            >
              {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-28 accent-brand-600"
              aria-label="Alarm volume"
            />
          </div>

          {detector.error && (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-500">
              {detector.error}
            </p>
          )}
        </div>

        {/* Live metrics */}
        <div className="space-y-4">
          <Card>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Activity className="h-4 w-4 text-brand-500" /> Live Metrics
            </div>
            <div className="mt-4 space-y-3">
              <Metric label="Eye Aspect Ratio" value={detector.frame.ear.toFixed(3)} icon={Eye} />
              <Metric label="Left EAR" value={detector.frame.leftEar.toFixed(3)} />
              <Metric label="Right EAR" value={detector.frame.rightEar.toFixed(3)} />
              <Metric
                label="Closed for"
                value={`${(detector.frame.closedForMs / 1000).toFixed(1)}s`}
                icon={Timer}
              />
              <Metric label="Blinks (session)" value={detector.blinkCount} />
              <Metric label="Frame rate" value={`${detector.frame.fps} FPS`} />
            </div>

            {/* EAR bar */}
            <div className="mt-5">
              <div className="mb-1 flex justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>EAR</span>
                <span>threshold {detectorSettings.earThreshold.toFixed(2)}</span>
              </div>
              <div className="relative h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    detector.frame.ear < detectorSettings.earThreshold ? 'bg-red-500' : 'bg-emerald-500'
                  )}
                  style={{ width: `${Math.min(100, (detector.frame.ear / 0.4) * 100)}%` }}
                />
                <div
                  className="absolute top-0 h-full w-0.5 bg-slate-900 dark:bg-white"
                  style={{ left: `${(detectorSettings.earThreshold / 0.4) * 100}%` }}
                />
              </div>
            </div>
          </Card>

          <Card>
            <label className="label flex items-center gap-2">
              <Camera className="h-4 w-4" /> Camera
            </label>
            <select
              className="input"
              value={cameraId ?? ''}
              onChange={(e) => setCameraId(e.target.value || undefined)}
            >
              <option value="">Default camera</option>
              {devices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Threshold and alarm delay are configured in Settings.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon?: typeof Eye;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="flex items-center gap-2 text-slate-500">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  );
}
