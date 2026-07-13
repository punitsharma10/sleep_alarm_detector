import { useCallback, useEffect, useRef, useState } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { computeEar, LEFT_EYE_RING, RIGHT_EYE_RING, type Point } from '@/lib/ear';
import { AlarmEngine, type AlarmSound } from '@/lib/alarm';
import type { DetectionFrame, EyeState } from '@/types';

const WASM_PATH = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm';
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

const BLINK_MAX_MS = 400; // closures shorter than this are counted as blinks

export interface DetectorSettings {
  earThreshold: number;
  alarmDelay: number; // seconds
  alarmVolume: number;
  alarmSound: AlarmSound;
  drawMesh: boolean;
}

export interface DetectionEpisode {
  type: 'blink' | 'drowsy' | 'sleep';
  durationMs: number;
  averageEar: number;
  minEar: number;
  blinkCount: number;
  alarmTriggered: boolean;
  startedAt: string;
  screenshot?: string;
}

interface UseDetectorArgs {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  settings: DetectorSettings;
  onEpisode?: (episode: DetectionEpisode) => void;
  onAlarmChange?: (active: boolean) => void;
}

const EMPTY_FRAME: DetectionFrame = {
  ear: 0,
  leftEar: 0,
  rightEar: 0,
  state: 'no-face',
  fps: 0,
  faceDetected: false,
  closedForMs: 0,
};

export function useDrowsinessDetector({
  videoRef,
  canvasRef,
  settings,
  onEpisode,
  onAlarmChange,
}: UseDetectorArgs) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'running' | 'paused' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [frame, setFrame] = useState<DetectionFrame>(EMPTY_FRAME);
  const [blinkCount, setBlinkCount] = useState(0);

  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const rafRef = useRef<number | null>(null);
  const alarmRef = useRef<AlarmEngine>(new AlarmEngine());
  const settingsRef = useRef(settings);
  const pausedRef = useRef(false);

  // Episode tracking (kept in refs so the RAF loop stays stable).
  const closedStartRef = useRef<number | null>(null);
  const earSamplesRef = useRef<number[]>([]);
  const episodeBlinksRef = useRef(0);
  const alarmActiveRef = useRef(false);
  const savedForEpisodeRef = useRef(false);
  const lastTimeRef = useRef(0);
  const fpsRef = useRef(0);
  const lastStateUpdateRef = useRef(0);

  useEffect(() => {
    settingsRef.current = settings;
    alarmRef.current.setVolume(settings.alarmVolume);
    alarmRef.current.setSound(settings.alarmSound);
  }, [settings]);

  const setAlarm = useCallback(
    (active: boolean) => {
      if (active === alarmActiveRef.current) return;
      alarmActiveRef.current = active;
      if (active) alarmRef.current.start();
      else alarmRef.current.stop();
      onAlarmChange?.(active);
    },
    [onAlarmChange]
  );

  const captureScreenshot = useCallback((): string | undefined => {
    const video = videoRef.current;
    if (!video) return undefined;
    const c = document.createElement('canvas');
    c.width = 320;
    c.height = (320 * video.videoHeight) / (video.videoWidth || 1);
    const ctx = c.getContext('2d');
    if (!ctx) return undefined;
    ctx.drawImage(video, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.6);
  }, [videoRef]);

  const finalizeEpisode = useCallback(
    (durationMs: number) => {
      const samples = earSamplesRef.current;
      const avg = samples.length ? samples.reduce((a, b) => a + b, 0) / samples.length : 0;
      const min = samples.length ? Math.min(...samples) : 0;
      const alarmTriggered = alarmActiveRef.current;
      const delayMs = settingsRef.current.alarmDelay * 1000;

      let type: DetectionEpisode['type'] = 'blink';
      if (durationMs >= delayMs) type = 'sleep';
      else if (durationMs >= BLINK_MAX_MS) type = 'drowsy';

      // Only persist meaningful events (skip ordinary blinks to avoid noise).
      if (type !== 'blink') {
        onEpisode?.({
          type,
          durationMs: Math.round(durationMs),
          averageEar: Number(avg.toFixed(3)),
          minEar: Number(min.toFixed(3)),
          blinkCount: episodeBlinksRef.current,
          alarmTriggered,
          startedAt: new Date(Date.now() - durationMs).toISOString(),
          screenshot: type === 'sleep' ? captureScreenshot() : undefined,
        });
      } else {
        episodeBlinksRef.current += 1;
        setBlinkCount((c) => c + 1);
      }

      earSamplesRef.current = [];
      savedForEpisodeRef.current = false;
    },
    [onEpisode, captureScreenshot]
  );

  const drawOverlay = useCallback(
    (landmarks: Point[] | null, state: EyeState) => {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = video.videoWidth || canvas.clientWidth;
      canvas.height = video.videoHeight || canvas.clientHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!landmarks) return;

      const w = canvas.width;
      const h = canvas.height;
      const color =
        state === 'sleep' ? '#ef4444' : state === 'closed' ? '#f59e0b' : '#38bdf8';

      // Face bounding box.
      let minX = 1;
      let minY = 1;
      let maxX = 0;
      let maxY = 0;
      for (const p of landmarks) {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(minX * w, minY * h, (maxX - minX) * w, (maxY - minY) * h);

      if (settingsRef.current.drawMesh) {
        ctx.fillStyle = 'rgba(56,189,248,0.5)';
        for (let i = 0; i < landmarks.length; i += 2) {
          const p = landmarks[i];
          ctx.fillRect(p.x * w - 0.5, p.y * h - 0.5, 1, 1);
        }
      }

      // Eye rings.
      const drawRing = (ring: number[]) => {
        ctx.beginPath();
        ring.forEach((idx, i) => {
          const p = landmarks[idx];
          if (i === 0) ctx.moveTo(p.x * w, p.y * h);
          else ctx.lineTo(p.x * w, p.y * h);
        });
        ctx.closePath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
      };
      drawRing(LEFT_EYE_RING);
      drawRing(RIGHT_EYE_RING);
    },
    [canvasRef, videoRef]
  );

  const loop = useCallback(() => {
    const video = videoRef.current;
    const landmarker = landmarkerRef.current;
    if (!video || !landmarker) return;

    if (pausedRef.current) {
      rafRef.current = requestAnimationFrame(loop);
      return;
    }

    const now = performance.now();
    if (lastTimeRef.current) {
      const dt = now - lastTimeRef.current;
      fpsRef.current = fpsRef.current * 0.9 + (1000 / dt) * 0.1;
    }
    lastTimeRef.current = now;

    let state: EyeState = 'no-face';
    let ear = 0;
    let leftEar = 0;
    let rightEar = 0;

    if (video.readyState >= 2) {
      const result = landmarker.detectForVideo(video, now);
      const landmarks = result.faceLandmarks?.[0] as Point[] | undefined;

      if (landmarks && landmarks.length) {
        const e = computeEar(landmarks);
        ear = e.avg;
        leftEar = e.left;
        rightEar = e.right;
        const s = settingsRef.current;
        const closed = ear < s.earThreshold;

        if (closed) {
          if (closedStartRef.current === null) {
            closedStartRef.current = now;
            earSamplesRef.current = [];
          }
          earSamplesRef.current.push(ear);
          const closedFor = now - closedStartRef.current;
          if (closedFor >= s.alarmDelay * 1000) {
            state = 'sleep';
            setAlarm(true);
            if (!savedForEpisodeRef.current) {
              savedForEpisodeRef.current = true;
              // Persist the sleep event as soon as the alarm fires.
              const samples = earSamplesRef.current;
              const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
              onEpisode?.({
                type: 'sleep',
                durationMs: Math.round(closedFor),
                averageEar: Number(avg.toFixed(3)),
                minEar: Number(Math.min(...samples).toFixed(3)),
                blinkCount: episodeBlinksRef.current,
                alarmTriggered: true,
                startedAt: new Date(Date.now() - closedFor).toISOString(),
                screenshot: captureScreenshot(),
              });
            }
          } else {
            state = 'closed';
          }
        } else {
          // Eyes open — close out any ongoing closure episode.
          if (closedStartRef.current !== null) {
            const closedFor = now - closedStartRef.current;
            setAlarm(false);
            if (!savedForEpisodeRef.current) {
              finalizeEpisode(closedFor);
            } else {
              savedForEpisodeRef.current = false;
              earSamplesRef.current = [];
            }
            closedStartRef.current = null;
            state = closedFor < BLINK_MAX_MS ? 'blink' : 'open';
          } else {
            state = 'open';
          }
        }

        drawOverlay(landmarks, state);
      } else {
        // Lost the face — silence alarm to avoid false positives.
        setAlarm(false);
        closedStartRef.current = null;
        drawOverlay(null, 'no-face');
      }
    }

    // Throttle React state updates to ~20fps to limit re-renders.
    if (now - lastStateUpdateRef.current > 50) {
      lastStateUpdateRef.current = now;
      const closedFor = closedStartRef.current ? now - closedStartRef.current : 0;
      setFrame({
        ear: Number(ear.toFixed(3)),
        leftEar: Number(leftEar.toFixed(3)),
        rightEar: Number(rightEar.toFixed(3)),
        state,
        fps: Math.round(fpsRef.current),
        faceDetected: state !== 'no-face',
        closedForMs: Math.round(closedFor),
      });
    }

    rafRef.current = requestAnimationFrame(loop);
  }, [videoRef, setAlarm, drawOverlay, finalizeEpisode, onEpisode, captureScreenshot]);

  const start = useCallback(
    async (stream: MediaStream) => {
      try {
        setError(null);
        setStatus('loading');

        if (!landmarkerRef.current) {
          const filesetResolver = await FilesetResolver.forVisionTasks(WASM_PATH);
          landmarkerRef.current = await FaceLandmarker.createFromOptions(filesetResolver, {
            baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
            runningMode: 'VIDEO',
            numFaces: 1,
          });
        }

        const video = videoRef.current!;
        video.srcObject = stream;
        await video.play();

        pausedRef.current = false;
        setStatus('running');
        rafRef.current = requestAnimationFrame(loop);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to start detector');
        setStatus('error');
      }
    },
    [videoRef, loop]
  );

  const pause = useCallback(() => {
    pausedRef.current = true;
    setAlarm(false);
    setStatus('paused');
  }, [setAlarm]);

  const resume = useCallback(() => {
    pausedRef.current = false;
    setStatus('running');
  }, []);

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setAlarm(false);
    closedStartRef.current = null;
    const video = videoRef.current;
    if (video?.srcObject) {
      (video.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      video.srcObject = null;
    }
    setFrame(EMPTY_FRAME);
    setStatus('idle');
  }, [videoRef, setAlarm]);

  const muteAlarm = useCallback(() => setAlarm(false), [setAlarm]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      alarmRef.current.dispose();
      landmarkerRef.current?.close();
    };
  }, []);

  return {
    status,
    error,
    frame,
    blinkCount,
    alarmActive: alarmActiveRef.current,
    start,
    stop,
    pause,
    resume,
    muteAlarm,
  };
}
