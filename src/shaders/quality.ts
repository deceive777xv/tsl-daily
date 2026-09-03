export const QUALITY_DPR = {
  low: 0.7,
  medium: 1,
  high: 1.5,
} as const;

export type QualityMode = 'auto' | keyof typeof QUALITY_DPR;

export function nextAutoDpr(
  current: number,
  averageFrameMs: number,
  targetFrameMs: number,
  maximum: number,
): number {
  if (averageFrameMs > targetFrameMs * 1.16) {
    return Math.max(0.65, Math.round((current - 0.1) * 100) / 100);
  }
  if (averageFrameMs < targetFrameMs * 0.76) {
    return Math.min(maximum, Math.round((current + 0.05) * 100) / 100);
  }
  return current;
}

export function dprForMode(mode: QualityMode, deviceDpr: number, autoDpr: number): number {
  const maximum = Math.min(deviceDpr, QUALITY_DPR.high);
  if (mode === 'auto') return Math.min(autoDpr, maximum);
  return Math.min(QUALITY_DPR[mode], maximum);
}
