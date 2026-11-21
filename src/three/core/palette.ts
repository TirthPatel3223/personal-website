'use client';

import { useTheme } from '@/components/ThemeProvider';

/* Shared colours for every 3D scene. Dark is the night archipelago the site is
   designed around; light is the same world by day. Scenes never hard-code a colour:
   they read it from here, so a theme toggle repaints everything at once.
   `glow` is an HDR multiplier for light sources (windows, lamps, neon): above 1.0 the
   bloom pass picks them up, so in light mode it stays at 1 and nothing blooms. */
export type Accent = 'teal' | 'amber' | 'violet' | 'blue' | 'rausch' | 'indigo' | 'sky';

export interface ScenePalette {
  mode: 'dark' | 'light';
  skyTop: string;
  skyBottom: string;
  fog: string;
  fogNear: number;
  fogFar: number;
  sea: string;
  hemiSky: string;
  hemiGround: string;
  hemiIntensity: number;
  key: string;
  keyIntensity: number;
  keyPosition: [number, number, number];
  fill: string;
  fillIntensity: number;
  glow: number;
  stars: boolean;
  grass: string;
  grassDark: string;
  dirt: string;
  rock: string;
  rockDark: string;
  path: string;
  concrete: string;
  asphalt: string;
  white: string;
  wall: string;
  wallAlt: string;
  roof: string;
  roofAlt: string;
  wood: string;
  metal: string;
  glass: string;
  window: string;
  foliage: string;
  foliageAlt: string;
  trunk: string;
  cloud: string;
  ink: string;
  accent: Record<Accent, string>;
}

export const DARK: ScenePalette = {
  mode: 'dark',
  skyTop: '#03060c',
  skyBottom: '#0e1a2c',
  fog: '#0b1422',
  fogNear: 230,
  fogFar: 660,
  sea: '#07101c',
  hemiSky: '#7d9be0',
  hemiGround: '#141a26',
  hemiIntensity: 1.0,
  key: '#c9dbff',
  keyIntensity: 1.7,
  keyPosition: [-90, 120, 80],
  fill: '#ffb27a',
  fillIntensity: 0.45,
  glow: 2.4,
  stars: true,
  grass: '#2f6e58',
  grassDark: '#245541',
  dirt: '#5c4838',
  rock: '#3f4757',
  rockDark: '#272c38',
  path: '#8c919c',
  concrete: '#7c8596',
  asphalt: '#1e232c',
  white: '#dbe3ee',
  wall: '#c9d0da',
  wallAlt: '#98a5b7',
  roof: '#4b5568',
  roofAlt: '#8a4343',
  wood: '#7d5c3e',
  metal: '#a1abba',
  glass: '#1d3a5e',
  window: '#ffcf86',
  foliage: '#2f7f5c',
  foliageAlt: '#3d936b',
  trunk: '#5d4431',
  cloud: '#3a4559',
  ink: '#111722',
  accent: {
    teal: '#2dd4bf',
    amber: '#f59e0b',
    violet: '#a78bfa',
    blue: '#60a5fa',
    rausch: '#ff5a5f',
    indigo: '#818cf8',
    sky: '#4e9bb9',
  },
};

export const LIGHT: ScenePalette = {
  mode: 'light',
  skyTop: '#8dbbee',
  skyBottom: '#eef4fb',
  fog: '#e7eff9',
  fogNear: 250,
  fogFar: 700,
  sea: '#b9d4ee',
  hemiSky: '#ffffff',
  hemiGround: '#d6c6a6',
  hemiIntensity: 1.3,
  key: '#fff1d6',
  keyIntensity: 2.5,
  keyPosition: [90, 140, 70],
  fill: '#9ec5ff',
  fillIntensity: 0.35,
  glow: 1,
  stars: false,
  grass: '#7cc497',
  grassDark: '#5eab7e',
  dirt: '#ab8667',
  rock: '#a59e93',
  rockDark: '#857d72',
  path: '#ece6da',
  concrete: '#d0d6de',
  asphalt: '#4b525d',
  white: '#ffffff',
  wall: '#f2f4f7',
  wallAlt: '#dde4ec',
  roof: '#6c7b91',
  roofAlt: '#c2524f',
  wood: '#a87c53',
  metal: '#b9c1cd',
  glass: '#86b9e8',
  window: '#ffe2a3',
  foliage: '#4daf7e',
  foliageAlt: '#66c08d',
  trunk: '#7b5b3d',
  cloud: '#ffffff',
  ink: '#334155',
  accent: {
    teal: '#0d9488',
    amber: '#d97706',
    violet: '#7c3aed',
    blue: '#2563eb',
    rausch: '#e11d48',
    indigo: '#4f46e5',
    sky: '#1f77b4',
  },
};

export function useScenePalette(): ScenePalette {
  const { theme } = useTheme();
  return theme === 'light' ? LIGHT : DARK;
}
