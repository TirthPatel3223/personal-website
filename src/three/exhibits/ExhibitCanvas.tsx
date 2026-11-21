'use client';

import { Suspense, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerformanceMonitor } from '@react-three/drei';
import Effects from '../core/Effects';
import { SceneEnvironment } from '../core/Environment';
import { useScenePalette } from '../core/palette';
import { downgradeQuality } from '../core/quality';

const COARSE = '(pointer: coarse)';
function subscribeCoarse(l: () => void) {
  const mq = window.matchMedia(COARSE);
  mq.addEventListener('change', l);
  return () => mq.removeEventListener('change', l);
}

/** True once the element is (nearly) on screen; flips back when it leaves. */
export function useInView<T extends Element>() {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin: '120px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, inView] as const;
}

/* A project exhibit's WebGL canvas. It only renders continuously while on screen.
   Drag-to-orbit is desktop-only: on touch screens a vertical swipe must scroll the
   page, not spin the model. Zoom is off so the wheel always scrolls the page. */
export default function ExhibitCanvas({
  quality,
  camera,
  target,
  children,
  tiltShift = false,
  environment = true,
  cloudSpread = 46,
  seaLevel = -28,
}: {
  quality: 'low' | 'high';
  camera: [number, number, number];
  target: [number, number, number];
  children: ReactNode;
  tiltShift?: boolean;
  environment?: boolean;
  cloudSpread?: number;
  seaLevel?: number;
}) {
  const palette = useScenePalette();
  const coarse = useSyncExternalStore(subscribeCoarse, () => window.matchMedia(COARSE).matches, () => false);
  const [ref, inView] = useInView<HTMLDivElement>();
  return (
    <div ref={ref} className="absolute inset-0">
      <Canvas
        dpr={quality === 'high' ? [1, 1.75] : [1, 1]}
        gl={{ antialias: quality !== 'high', powerPreference: 'high-performance' }}
        camera={{ fov: 35, position: camera, near: 0.1, far: 2000 }}
        frameloop={inView ? 'always' : 'demand'}
        style={{ touchAction: coarse ? 'pan-y' : 'none' }}
      >
        {environment && <SceneEnvironment palette={palette} seaLevel={seaLevel} cloudSpread={cloudSpread} />}
        <Suspense fallback={null}>{children}</Suspense>
        <OrbitControls
          makeDefault
          target={target}
          enabled={!coarse}
          enablePan={false}
          enableZoom={false}
          enableDamping
          rotateSpeed={0.55}
          minPolarAngle={0.25}
          maxPolarAngle={1.45}
        />
        {quality === 'high' && <Effects palette={palette} tiltShift={tiltShift} />}
        <PerformanceMonitor onDecline={downgradeQuality} />
      </Canvas>
    </div>
  );
}
