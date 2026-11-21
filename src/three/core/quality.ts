'use client';

import { useSyncExternalStore } from 'react';

/* Render tiers for every 3D surface on the site.
   off:  no WebGL work at all; the page shows posters and the 2D layout.
   low:  phones, Save-Data, weak GPUs: DPR 1, no postprocessing.
   high: desktops: higher DPR, bloom and the tilt-shift "miniature" pass.
   `?quality=off|low|high` overrides detection, which is handy for testing. */
export type Quality = 'off' | 'low' | 'high';

let cached: Quality | null = null;
const listeners = new Set<() => void>();

function detect(): Quality {
  try {
    const forced = new URLSearchParams(window.location.search).get('quality');
    if (forced === 'off' || forced === 'low' || forced === 'high') return forced;

    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) return 'off';
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : '';
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    // Software rasterisers would crawl through the scene: posters read better.
    if (/swiftshader|llvmpipe|softpipe|software/i.test(renderer)) return 'off';

    const nav = navigator as Navigator & {
      connection?: { saveData?: boolean };
      deviceMemory?: number;
    };
    if (nav.connection?.saveData) return 'low';
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const memory = nav.deviceMemory ?? 8;
    const cores = nav.hardwareConcurrency ?? 8;
    if (coarse || memory < 4 || cores < 4) return 'low';
    return 'high';
  } catch {
    return 'off';
  }
}

export function getQuality(): Quality {
  if (cached === null) cached = detect();
  return cached;
}

/** Called by PerformanceMonitor when a device cannot hold its frame rate. */
export function downgradeQuality() {
  if (getQuality() !== 'high') return;
  cached = 'low';
  listeners.forEach((l) => l());
}

function subscribeQuality(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** 'pending' on the server and during hydration, then the detected tier. */
export function useQuality(): Quality | 'pending' {
  return useSyncExternalStore<Quality | 'pending'>(subscribeQuality, getQuality, () => 'pending');
}

const REDUCED = '(prefers-reduced-motion: reduce)';

function subscribeReducedMotion(listener: () => void) {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener('change', listener);
  return () => mq.removeEventListener('change', listener);
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED).matches,
    () => false,
  );
}
