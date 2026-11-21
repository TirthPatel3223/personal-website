'use client';

import { useEffect, useMemo } from 'react';
import { MeshBuilder } from '../core/builder';
import { islandGeometry } from '../core/island';
import { glassMaterial, glowMaterial, litMaterial } from '../core/materials';
import { mulberry32 } from '../core/math';
import type { ScenePalette } from '../core/palette';
import { airliner } from './parts/aircraft';
import { SignBoards } from './parts/signs';
import type { Kit } from './parts/types';

/* The shared core of every diorama. An island's static props are written into a Kit
   (lit, glow and glass builders plus a list of text signs) once per palette, then
   drawn as at most four meshes. Moving things (people, vehicles, rides) are separate
   components, mostly instanced. */

export type { Kit } from './parts/types';

export interface IslandProps {
  palette: ScenePalette;
  animate: boolean;
}

export type BuildFn = (k: Kit) => void;

/** Bakes an island's static props once per palette. */
export function useBaked(build: BuildFn, palette: ScenePalette, seed: number) {
  const baked = useMemo(() => {
    const k: Kit = {
      lit: new MeshBuilder(),
      glow: new MeshBuilder(palette.glow),
      glass: new MeshBuilder(),
      signs: [],
      p: palette,
      rng: mulberry32(seed),
    };
    build(k);
    const lit = k.lit.build();
    return {
      lit,
      glow: k.glow.build(),
      glass: k.glass.empty ? null : k.glass.build(),
      signs: k.signs,
    };
  }, [build, palette, seed]);
  useEffect(
    () => () => {
      baked.lit.dispose();
      baked.glow.dispose();
      baked.glass?.dispose();
    },
    [baked],
  );
  return baked;
}

export function Baked({ build, palette, seed }: { build: BuildFn; palette: ScenePalette; seed: number }) {
  const { lit, glow, glass, signs } = useBaked(build, palette, seed);
  return (
    <>
      <mesh geometry={lit} material={litMaterial()} />
      <mesh geometry={glow} material={glowMaterial()} />
      {glass && <mesh geometry={glass} material={glassMaterial()} renderOrder={2} />}
      <SignBoards specs={signs} palette={palette} />
    </>
  );
}

/* ── Terrain ────────────────────────────────────────────────────────── */

export function base(k: Kit, seed: number, radius: number, depth: number) {
  k.lit.add(islandGeometry(seed, radius, depth, k.p));
}

/** A thin neon ring hugging the island rim: the island's accent colour at night. */
export function rimGlow(k: Kit, radius: number, color: string) {
  k.glow.torus(radius * 0.988, 0.06, 4, 96, { position: [0, 0.02, 0], rotation: [Math.PI / 2, 0, 0], color });
}

/* ── Jets for the exhibits ──────────────────────────────────────────── */

/** A small airliner (about 2.6 long, nose along +x), gear up: the crew exhibit's flying jet. */
export function jet(b: MeshBuilder, glow: MeshBuilder, p: ScenePalette, stripe: string) {
  airliner(b, glow, p, { livery: stripe, scale: 0.5 });
}

export function useJetGeometry(palette: ScenePalette, stripe: string) {
  const geoms = useMemo(() => {
    const lit = new MeshBuilder();
    const glow = new MeshBuilder(palette.glow);
    jet(lit, glow, palette, stripe);
    return { lit: lit.build(), glow: glow.build() };
  }, [palette, stripe]);
  useEffect(
    () => () => {
      geoms.lit.dispose();
      geoms.glow.dispose();
    },
    [geoms],
  );
  return geoms;
}
