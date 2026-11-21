'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import Effects from '../core/Effects';
import { useScenePalette } from '../core/palette';
import { downgradeQuality, useReducedMotion } from '../core/quality';
import ArchipelagoScene from './ArchipelagoScene';
import { FOV } from './tourConfig';
import { useTourDimmed } from './tourState';

/* The homepage's single WebGL canvas: fixed behind the page, never interactive
   (the DOM carries every control). It stops rendering once the tour is behind the
   reader, and when motion is reduced it only redraws on scroll. */
export default function ArchipelagoCanvas({ quality }: { quality: 'low' | 'high' }) {
  const reduced = useReducedMotion();
  const dimmed = useTourDimmed();
  const palette = useScenePalette();
  return (
    <Canvas
      dpr={quality === 'high' ? [1, 1.75] : [1, 1]}
      gl={{ antialias: quality !== 'high', powerPreference: 'high-performance' }}
      camera={{ fov: FOV, near: 1, far: 2600, position: [0, 160, 300] }}
      frameloop={reduced || dimmed ? 'demand' : 'always'}
      style={{ pointerEvents: 'none' }}
    >
      <Suspense fallback={null}>
        <ArchipelagoScene reduced={reduced} />
      </Suspense>
      {quality === 'high' && <Effects palette={palette} />}
      <PerformanceMonitor onDecline={downgradeQuality} />
    </Canvas>
  );
}
