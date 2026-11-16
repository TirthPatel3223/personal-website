'use client';

import { useEffect, useRef } from 'react';
import { useTheme } from './ThemeProvider';

/* Fixed background for the cube page: the real Maltese Gear Cube, scrambling as you scroll.

   The frames are renders of my own 3D simulator (tangram-cube-extreme), posed exactly with its
   animator: the solved cube at the top of the page, then 20 real turns,
   R U F' R' U2 F L' U R' D F U' R2 B' U F R' U' F2 R, each caught at six points mid-turn, so the
   middle layers gear round and the gears spin and tilt as they do on the physical puzzle. The view
   swings 90° over the sequence, from one corner to the next. Pre-rendered rather than live WebGL:
   the simulator builds its pieces with WebAssembly mesh booleans, far too heavy for a backdrop. */
const FRAMES = 121;
const src = (i: number) => `/mgc-scroll/${String(i).padStart(3, '0')}.webp`;

/* Coarse to fine, so the whole scroll range is covered early and then filled in. */
function loadOrder(): number[] {
  const seen = new Set<number>();
  const order: number[] = [];
  for (const step of [24, 12, 6, 3, 1]) {
    for (let i = 0; i < FRAMES; i += step) {
      if (!seen.has(i)) { seen.add(i); order.push(i); }
    }
  }
  if (!seen.has(FRAMES - 1)) order.push(FRAMES - 1);
  return order;
}

export default function MalteseScrollCube() {
  const { theme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const images: (HTMLImageElement | null)[] = Array.from({ length: FRAMES }, () => null);
    let shown = -1;
    let raf = 0;
    let cancelled = false;

    const target = () => {
      const el = document.scrollingElement ?? document.documentElement;
      const scrollable = el.scrollHeight - window.innerHeight;
      const p = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
      return Math.round(p * (FRAMES - 1));
    };

    /* The nearest frame that has arrived, so scrolling never waits on the network. */
    const nearestLoaded = (i: number) => {
      for (let d = 0; d < FRAMES; d++) {
        if (images[i - d]) return i - d;
        if (images[i + d]) return i + d;
      }
      return -1;
    };

    /* Full strength while it is the hero visual, half once the reading starts. */
    const fade = () => {
      const k = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * 0.8)));
      canvas.style.opacity = String(1 - 0.5 * k);
    };

    const draw = () => {
      raf = 0;
      fade();
      const i = nearestLoaded(target());
      if (i < 0 || i === shown) return;
      const img = images[i]!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      shown = i;
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(draw);
    };

    /* Four requests in flight at a time, in coarse-to-fine order. */
    const queue = loadOrder();
    const pump = () => {
      const i = queue.shift();
      if (i === undefined || cancelled) return;
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        if (cancelled) return;
        images[i] = img;
        schedule();
        pump();
      };
      img.onerror = () => pump();
      img.src = src(i);
    };
    for (let k = 0; k < 4; k++) pump();

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, []);

  const bgGradient = theme === 'dark'
    ? 'radial-gradient(ellipse at 60% 45%, #0d1520 0%, #050810 60%, #000000 100%)'
    : 'radial-gradient(ellipse at 60% 45%, #dce8f5 0%, #eef4fb 60%, #f8fbff 100%)';

  return (
    <div aria-hidden style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', background: bgGradient }}>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
        <div className="mgc-scroll-cube-pos">
          <div className="mgc-scroll-cube">
            <canvas ref={canvasRef} width={560} height={560} style={{ width: '100%', height: '100%', display: 'block' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
