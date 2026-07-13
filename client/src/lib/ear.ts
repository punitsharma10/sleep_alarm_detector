/**
 * Eye Aspect Ratio (EAR) utilities for MediaPipe Face Landmarker output.
 *
 * EAR = (‖p2 − p6‖ + ‖p3 − p5‖) / (2 · ‖p1 − p4‖)
 *
 * A high EAR (~0.3) means the eye is open; it collapses toward 0 as the eye
 * closes. The classic reference is Soukupová & Čech (2016).
 */

export interface Point {
  x: number;
  y: number;
  z?: number;
}

/**
 * Six-point landmark indices per eye for MediaPipe's 468/478-point face mesh.
 * Order matches the EAR formula: [corner, top, top, corner, bottom, bottom].
 */
export const RIGHT_EYE = [33, 160, 158, 133, 153, 144] as const;
export const LEFT_EYE = [362, 385, 387, 263, 373, 380] as const;

// Landmarks used to outline each eye when drawing the overlay.
export const RIGHT_EYE_RING = [33, 160, 158, 133, 153, 144];
export const LEFT_EYE_RING = [362, 385, 387, 263, 373, 380];

function distance(a: Point, b: Point): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

export function eyeAspectRatio(landmarks: Point[], indices: readonly number[]): number {
  const [p1, p2, p3, p4, p5, p6] = indices.map((i) => landmarks[i]);
  if (!p1 || !p4) return 0;
  const vertical = distance(p2, p6) + distance(p3, p5);
  const horizontal = 2 * distance(p1, p4);
  if (horizontal === 0) return 0;
  return vertical / horizontal;
}

export function computeEar(landmarks: Point[]): {
  left: number;
  right: number;
  avg: number;
} {
  const left = eyeAspectRatio(landmarks, LEFT_EYE);
  const right = eyeAspectRatio(landmarks, RIGHT_EYE);
  return { left, right, avg: (left + right) / 2 };
}
