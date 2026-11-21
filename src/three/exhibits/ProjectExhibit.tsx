'use client';

import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';
import { useQuality } from '../core/quality';
import { ExhibitPlaceholder } from './ExhibitShell';

/* Which project pages get a 3D exhibit, mounted from the server-rendered
   [slug]/page.tsx. Each exhibit is its own chunk, loaded on the client only (Next 16:
   `ssr: false` is only allowed inside a Client Component, which this is). On the
   'off' tier nothing renders and the page reads exactly as it did before. */

type ExhibitProps = { quality: 'low' | 'high' };

const loading = () => <ExhibitPlaceholder />;

const EXHIBITS: Record<string, ComponentType<ExhibitProps>> = {
  'airline-crew-pairing-rl': dynamic(() => import('./crew/CrewExhibit'), { ssr: false, loading }),
  'mapblazer-route-optimization': dynamic(() => import('./park/ParkExhibit').then((m) => m.RouteExhibit), { ssr: false, loading }),
  'mapblazer-wait-time-prediction': dynamic(() => import('./park/ParkExhibit').then((m) => m.ForecastExhibit), { ssr: false, loading }),
  'course-rag-pipeline': dynamic(() => import('./agent/AgentExhibit'), { ssr: false, loading }),
};

/* These two need no WebGL tier: Puzzle Lab's exhibit is the live simulator (an iframe),
   and the cube solver's is a set of pre-rendered stage images. */
const PuzzleLabExhibit = dynamic(() => import('./puzzleLab/PuzzleLabExhibit'), { ssr: false, loading });
const CubeExhibit = dynamic(() => import('./cube/CubeExhibit'), { ssr: false, loading });

export default function ProjectExhibit({ slug }: { slug: string }) {
  const quality = useQuality();
  if (slug === 'puzzle-lab') return <PuzzleLabExhibit />;
  if (slug === 'deep-cube-solver') return <CubeExhibit />;
  const Exhibit = EXHIBITS[slug];
  if (!Exhibit || quality === 'off') return null;
  if (quality === 'pending') return <ExhibitPlaceholder />;
  return <Exhibit quality={quality} />;
}
