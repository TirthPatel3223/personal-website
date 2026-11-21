'use client';

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { ScenePalette } from '../../core/palette';

/* Text signs for the dioramas: shop names, HOSPITAL, gate numbers, runway numbers.
   Every sign of an island is drawn into one canvas atlas and merged into one mesh, so
   an island's signs cost a single draw call. Signs that are lit at night (most of
   them) render slightly over 1.0 in dark mode, so their lettering picks up bloom;
   painted markings (runway numbers, a helipad H) never glow. */

type V3 = [number, number, number];

export interface SignSpec {
  /** One line, or several separated by \n. */
  text: string;
  position: V3;
  /** Yaw: the sign faces +z before this rotation. */
  rotationY?: number;
  /** Rotation about the sign's own x axis: -PI/2 lays it flat, facing up (ground markings). */
  tilt?: number;
  width: number;
  height: number;
  bg: string;
  fg: string;
  /** CSS font family. */
  font?: string;
  weight?: number;
  icon?: 'cross' | 'star';
  /** Lit at night (default true). */
  lit?: boolean;
  /** Custom painter; replaces the text. */
  draw?: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
}

const SANS = 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
const ATLAS_W = 2048;
const GUTTER = 6;

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCross(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number) {
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, cx - s / 2, cy - s / 2, s, s, s * 0.12);
  ctx.fill();
  ctx.fillStyle = '#e11d2e';
  const a = s * 0.62;
  const b = s * 0.2;
  ctx.fillRect(cx - a / 2, cy - b / 2, a, b);
  ctx.fillRect(cx - b / 2, cy - a / 2, b, a);
}

export function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, fill: string) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
}

function paint(ctx: CanvasRenderingContext2D, s: SignSpec, w: number, h: number) {
  if (s.bg !== 'transparent') {
    ctx.fillStyle = s.bg;
    roundRect(ctx, 0, 0, w, h, Math.min(w, h) * 0.12);
    ctx.fill();
  }
  if (s.draw) {
    s.draw(ctx, w, h);
    return;
  }
  const lines = s.text.split('\n');
  let left = 0;
  if (s.icon) {
    const size = h * 0.72;
    if (s.icon === 'cross') drawCross(ctx, h * 0.5, h / 2, size);
    else drawStar(ctx, h * 0.5, h / 2, size * 0.5, s.fg);
    left = h * 0.85;
  }
  const avail = (w - left) * 0.88;
  let size = (h * 0.7) / lines.length;
  const font = (px: number) => `${s.weight ?? 800} ${px}px ${s.font ?? SANS}`;
  ctx.font = font(size);
  const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
  if (widest > avail) size *= avail / widest;
  ctx.font = font(size);
  ctx.fillStyle = s.fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const lh = size * 1.12;
  const top = h / 2 - ((lines.length - 1) * lh) / 2;
  lines.forEach((l, i) => ctx.fillText(l, left + (w - left) / 2, top + i * lh + size * 0.04));
}

interface Cell {
  x: number;
  y: number;
  w: number;
  h: number;
}

function buildAtlas(specs: SignSpec[]) {
  // Pixel size per sign: about 110 px per world unit of height, clamped.
  const cells: Cell[] = [];
  let x = 0;
  let y = 0;
  let row = 0;
  for (const s of specs) {
    const h = Math.round(Math.min(150, Math.max(40, s.height * 110)));
    const w = Math.min(ATLAS_W - 2 * GUTTER, Math.round((h * s.width) / s.height));
    if (x + w + GUTTER > ATLAS_W) {
      x = 0;
      y += row + GUTTER;
      row = 0;
    }
    cells.push({ x: x + GUTTER, y: y + GUTTER, w, h });
    x += w + GUTTER;
    row = Math.max(row, h + GUTTER);
  }
  const used = y + row + GUTTER;
  const height = Math.min(4096, Math.pow(2, Math.ceil(Math.log2(Math.max(64, used)))));
  const canvas = document.createElement('canvas');
  canvas.width = ATLAS_W;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  specs.forEach((s, i) => {
    const c = cells[i];
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.beginPath();
    ctx.rect(0, 0, c.w, c.h);
    ctx.clip();
    paint(ctx, s, c.w, c.h);
    ctx.restore();
  });
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.needsUpdate = true;

  const quads = (lit: boolean) => {
    const parts: THREE.BufferGeometry[] = [];
    specs.forEach((s, i) => {
      if ((s.lit ?? true) !== lit) return;
      const c = cells[i];
      const g = new THREE.PlaneGeometry(s.width, s.height);
      const uv = g.getAttribute('uv') as THREE.BufferAttribute;
      for (let v = 0; v < uv.count; v++) {
        const u = (c.x + uv.getX(v) * c.w) / ATLAS_W;
        const t = 1 - (c.y + (1 - uv.getY(v)) * c.h) / height;
        uv.setXY(v, u, t);
      }
      const m = new THREE.Matrix4().compose(
        new THREE.Vector3(...s.position),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(s.tilt ?? 0, s.rotationY ?? 0, 0, 'YXZ')),
        new THREE.Vector3(1, 1, 1),
      );
      g.applyMatrix4(m);
      parts.push(g);
    });
    if (!parts.length) return null;
    const merged = mergeGeometries(parts, false);
    for (const p of parts) p.dispose();
    return merged;
  };
  return { texture, lit: quads(true), unlit: quads(false) };
}

export function SignBoards({ specs, palette }: { specs: SignSpec[]; palette: ScenePalette }) {
  const atlas = useMemo(() => (specs.length && typeof document !== 'undefined' ? buildAtlas(specs) : null), [specs]);
  const materials = useMemo(() => {
    if (!atlas) return null;
    const night = palette.mode === 'dark';
    return {
      lit: new THREE.MeshBasicMaterial({
        map: atlas.texture,
        toneMapped: false,
        transparent: true,
        alphaTest: 0.02,
        color: new THREE.Color(1, 1, 1).multiplyScalar(night ? 1.3 : 1),
      }),
      unlit: new THREE.MeshBasicMaterial({
        map: atlas.texture,
        transparent: true,
        alphaTest: 0.02,
        color: new THREE.Color(1, 1, 1).multiplyScalar(night ? 0.55 : 0.95),
      }),
    };
  }, [atlas, palette]);
  useEffect(
    () => () => {
      atlas?.texture.dispose();
      atlas?.lit?.dispose();
      atlas?.unlit?.dispose();
    },
    [atlas],
  );
  useEffect(
    () => () => {
      materials?.lit.dispose();
      materials?.unlit.dispose();
    },
    [materials],
  );
  if (!atlas || !materials) return null;
  return (
    <>
      {atlas.lit && <mesh geometry={atlas.lit} material={materials.lit} />}
      {atlas.unlit && <mesh geometry={atlas.unlit} material={materials.unlit} />}
    </>
  );
}
