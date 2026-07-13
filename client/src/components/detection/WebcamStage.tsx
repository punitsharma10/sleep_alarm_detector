import { forwardRef, RefObject } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, VideoOff } from 'lucide-react';
import type { DetectionFrame } from '@/types';
import { cn, formatDuration } from '@/lib/utils';

interface Props {
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  frame: DetectionFrame;
  alarmActive: boolean;
  status: 'idle' | 'loading' | 'running' | 'paused' | 'error';
}

const stateLabels: Record<string, { text: string; cls: string }> = {
  open: { text: 'Eyes Open', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  blink: { text: 'Blink', cls: 'bg-brand-500/15 text-brand-300 border-brand-500/30' },
  closed: { text: 'Eyes Closed', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  sleep: { text: 'SLEEP!', cls: 'bg-red-500/20 text-red-400 border-red-500/40' },
  'no-face': { text: 'No Face', cls: 'bg-slate-500/15 text-slate-400 border-slate-500/30' },
};

export const WebcamStage = forwardRef<HTMLDivElement, Props>(function WebcamStage(
  { videoRef, canvasRef, frame, alarmActive, status },
  containerRef
) {
  const label = stateLabels[frame.state] ?? stateLabels['no-face'];

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative aspect-video w-full overflow-hidden rounded-2xl border bg-black transition',
        alarmActive
          ? 'border-red-500 animate-pulse-ring'
          : 'border-slate-200 dark:border-white/10'
      )}
    >
      <video
        ref={videoRef}
        className="h-full w-full -scale-x-100 object-cover"
        playsInline
        muted
      />
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 h-full w-full -scale-x-100 object-cover"
      />

      {/* Idle / loading placeholder */}
      {(status === 'idle' || status === 'loading') && (
        <div className="absolute inset-0 grid place-items-center bg-black/60 text-center text-white">
          <div>
            {status === 'loading' ? (
              <>
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                <p className="mt-3 text-sm text-white/70">Loading AI model…</p>
              </>
            ) : (
              <>
                <VideoOff className="mx-auto h-8 w-8 text-white/50" />
                <p className="mt-3 text-sm text-white/70">Camera is off. Press Start to begin.</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Live overlays */}
      {status === 'running' && (
        <>
          <div className="absolute left-3 top-3 flex items-center gap-2">
            <span className={cn('rounded-lg border px-2.5 py-1 text-xs font-semibold backdrop-blur', label.cls)}>
              {label.text}
            </span>
            <span className="rounded-lg border border-white/20 bg-black/40 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
              {frame.fps} FPS
            </span>
          </div>
          <div className="absolute right-3 top-3 rounded-lg border border-white/20 bg-black/40 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
            EAR {frame.ear.toFixed(3)}
          </div>
        </>
      )}

      {/* Alarm banner */}
      <AnimatePresence>
        {alarmActive && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-3 bg-red-600/90 py-3 text-white backdrop-blur"
          >
            <AlertTriangle className="h-5 w-5 animate-bounce" />
            <span className="font-bold uppercase tracking-wide">Wake up! Eyes closed for {formatDuration(frame.closedForMs)}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
