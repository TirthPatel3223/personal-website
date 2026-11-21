'use client';

import dynamic from 'next/dynamic';
import AnimatedBackground from '@/components/AnimatedBackground';
import { useQuality } from '../core/quality';
import { useTourDimmed } from './tourState';

/* Loads the archipelago only on the client, after hydration, so the hero text is the
   first thing painted. Until then (and on the 'off' tier) a CSS night sky holds the
   frame; 'off' devices keep the original blob background instead of WebGL. */
const ArchipelagoCanvas = dynamic(() => import('./ArchipelagoCanvas'), { ssr: false });

export default function HomeBackdrop() {
  const quality = useQuality();
  const dimmed = useTourDimmed();
  if (quality === 'off') return <AnimatedBackground />;
  return (
    <div className="home-backdrop" data-dimmed={dimmed} aria-hidden="true">
      {quality !== 'pending' && <ArchipelagoCanvas quality={quality} />}
    </div>
  );
}
