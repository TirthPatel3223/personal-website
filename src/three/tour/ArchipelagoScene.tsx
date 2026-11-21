'use client';

import { useEffect, useRef, useState, type ComponentType } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { SceneEnvironment } from '../core/Environment';
import { dampFactor } from '../core/math';
import { useScenePalette } from '../core/palette';
import type { IslandProps } from '../islands/kit';
import WorkshopIsland from '../islands/WorkshopIsland';
import ParkIsland from '../islands/ParkIsland';
import MriIsland from '../islands/MriIsland';
import AirportIsland from '../islands/AirportIsland';
import VillageIsland from '../islands/VillageIsland';
import HubIsland from '../islands/HubIsland';
import TownIsland from '../islands/TownIsland';
import { ISLANDS, islandFacing, islandPosition, makePose, poseAt, type IslandId } from './tourConfig';
import { subscribeFrames, tour } from './tourState';

export const ISLAND_COMPONENTS: Record<IslandId, ComponentType<IslandProps>> = {
  workshop: WorkshopIsland,
  park: ParkIsland,
  mri: MriIsland,
  airport: AirportIsland,
  village: VillageIsland,
  hub: HubIsland,
  town: TownIsland,
};

function CameraRig({ reduced }: { reduced: boolean }) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);
  const rig = useRef<{ target: ReturnType<typeof makePose>; look: ReturnType<typeof makePose>['look']; ready: boolean } | null>(null);

  useEffect(() => subscribeFrames(() => invalidate()), [invalidate]);

  useFrame((_, dt) => {
    if (!rig.current) {
      const t = makePose();
      rig.current = { target: t, look: t.look.clone(), ready: false };
    }
    const r = rig.current;
    poseAt(tour.kf, size.width / Math.max(1, size.height), r.target);
    if (reduced || !r.ready) {
      camera.position.copy(r.target.pos);
      r.look.copy(r.target.look);
      r.ready = true;
    } else {
      // A generous dt clamp: slow devices still converge in a few frames.
      const f = dampFactor(3.2, Math.min(dt, 0.25));
      camera.position.lerp(r.target.pos, f);
      r.look.lerp(r.target.look, f);
    }
    camera.lookAt(r.look);
  });
  return null;
}

export default function ArchipelagoScene({ reduced }: { reduced: boolean }) {
  const palette = useScenePalette();
  // Each island takes 40-100 ms to build: mount one per frame instead of all at once,
  // so the page never stalls on a single long task.
  const [shown, setShown] = useState(1);
  useEffect(() => {
    if (shown >= ISLANDS.length) return;
    const id = requestAnimationFrame(() => setShown((n) => n + 1));
    return () => cancelAnimationFrame(id);
  }, [shown]);
  return (
    <>
      <SceneEnvironment palette={palette} seaLevel={-58} cloudSpread={92} />
      <CameraRig reduced={reduced} />
      {ISLANDS.slice(0, shown).map((isl, i) => {
        const Island = ISLAND_COMPONENTS[isl.id];
        return (
          <group key={isl.id} position={islandPosition(i)} rotation={[0, islandFacing(i), 0]}>
            <Island palette={palette} animate={!reduced} />
          </group>
        );
      })}
    </>
  );
}
