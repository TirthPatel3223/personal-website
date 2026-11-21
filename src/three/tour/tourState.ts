'use client';

import { useSyncExternalStore } from 'react';

/* The one piece of state the DOM tour and the WebGL scene share. The scroll handler
   writes it; the camera reads `tour.kf` every frame without re-rendering anything.
   React only re-renders when the active stop or the dimmed flag actually change. */

export const tour = { kf: 0 };

let active = -1;
let dimmed = false;
const stateListeners = new Set<() => void>();
const frameListeners = new Set<() => void>();

export function setTourFrame(kf: number, nextActive: number, nextDimmed: boolean) {
  tour.kf = kf;
  frameListeners.forEach((l) => l());
  if (nextActive !== active || nextDimmed !== dimmed) {
    active = nextActive;
    dimmed = nextDimmed;
    stateListeners.forEach((l) => l());
  }
}

function subscribeState(l: () => void) {
  stateListeners.add(l);
  return () => {
    stateListeners.delete(l);
  };
}

/** Every keyframe change, for demand-mode canvases that must redraw on scroll. */
export function subscribeFrames(l: () => void) {
  frameListeners.add(l);
  return () => {
    frameListeners.delete(l);
  };
}

export function useTourActive() {
  return useSyncExternalStore(subscribeState, () => active, () => -1);
}

export function useTourDimmed() {
  return useSyncExternalStore(subscribeState, () => dimmed, () => false);
}
