'use client';

import { useEffect, useMemo, useRef, type RefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { MeshBuilder } from '../../core/builder';
import { glassMaterial, glowMaterial, litMaterial } from '../../core/materials';
import type { ScenePalette } from '../../core/palette';
import { Fleet, Walkers } from '../../islands/parts/movers';
import { person } from '../../islands/parts/people';
import { SignBoards } from '../../islands/parts/signs';
import { archPoint, visitorAt, type Leg, type ParkData, type ParkNode } from './parkData';
import { buildParkWorld } from './parkWorld';
import { RideMovers, RideSpins } from './rides/motion';

/* The Mapblazer park: every attraction in the route solver's Disneyland data in its
   own plot, walkways along the plot borders, and the solver's example day drawn on
   top. The planned route glows on the walkways it uses (bright where the visitor has
   already walked, pulsing ahead where they will go), one visitor walks it to the
   minute, and a glass tower at each stop shows its forecast queue. */

export type View = { kind: 'park' } | { kind: 'follow' } | { kind: 'ride'; id: number };

export const KIND_LABEL: Record<ParkNode['kind'], string> = {
  entrance: 'Park gate',
  dark: 'Indoor ride',
  show: 'Show or walk-through',
  spinner: 'Spinning ride',
  water: 'Water ride',
  coaster: 'Coaster',
  train: 'Train or vehicle ride',
};

export const PARK_DIST = 84;

/* ── The planned route ──────────────────────────────────────────────── */

const ribbonVertex = /* glsl */ `
  attribute float aDist;
  varying float vDist;
  void main() {
    vDist = aDist;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ribbonFragment = /* glsl */ `
  uniform float uProgress;
  uniform float uTime;
  uniform vec3 uDone;
  uniform vec3 uPlan;
  uniform vec3 uPulse;
  varying float vDist;
  void main() {
    vec3 col;
    if (vDist <= uProgress) {
      col = uDone;
    } else {
      float ph = fract((vDist - uTime * 2.4) / 2.6);
      float pulse = smoothstep(0.0, 0.1, ph) * (1.0 - smoothstep(0.1, 0.5, ph));
      col = mix(uPlan, uPulse, pulse);
    }
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

function ribbonGeometry(legs: Leg[]) {
  const pos: number[] = [];
  const dist: number[] = [];
  const W = 0.42;
  const push = (x: number, y: number, z: number, d: number) => {
    pos.push(x, y, z);
    dist.push(d);
  };
  legs.forEach((leg, li) => {
    const y = 0.075 + li * 0.004;
    let d = leg.start;
    for (let i = 1; i < leg.pts.length; i++) {
      const [ax, az] = leg.pts[i - 1];
      const [bx, bz] = leg.pts[i];
      const len = Math.hypot(bx - ax, bz - az);
      if (len < 1e-5) continue;
      const nx = (-(bz - az) / len) * (W / 2);
      const nz = ((bx - ax) / len) * (W / 2);
      push(ax + nx, y, az + nz, d);
      push(ax - nx, y, az - nz, d);
      push(bx - nx, y, bz - nz, d + len);
      push(ax + nx, y, az + nz, d);
      push(bx - nx, y, bz - nz, d + len);
      push(bx + nx, y, bz + nz, d + len);
      d += len;
      // Round join.
      for (let k = 0; k < 10; k++) {
        const a0 = (k / 10) * Math.PI * 2;
        const a1 = ((k + 1) / 10) * Math.PI * 2;
        push(bx, y, bz, d);
        push(bx + Math.cos(a0) * (W / 2), y, bz + Math.sin(a0) * (W / 2), d);
        push(bx + Math.cos(a1) * (W / 2), y, bz + Math.sin(a1) * (W / 2), d);
      }
    }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aDist', new THREE.Float32BufferAttribute(dist, 1));
  g.computeBoundingSphere();
  return g;
}

function RouteRibbon({ legs, palette, progressRef, animate }: { legs: Leg[]; palette: ScenePalette; progressRef: RefObject<number>; animate: boolean }) {
  const geometry = useMemo(() => ribbonGeometry(legs), [legs]);
  const material = useMemo(() => {
    const dark = palette.mode === 'dark';
    const amber = new THREE.Color(palette.accent.amber);
    return new THREE.ShaderMaterial({
      uniforms: {
        uProgress: { value: 0 },
        uTime: { value: 0 },
        uDone: { value: dark ? amber.clone().multiplyScalar(2.6) : new THREE.Color('#c2410c') },
        uPlan: { value: dark ? amber.clone().multiplyScalar(0.62) : new THREE.Color('#f59e0b') },
        uPulse: { value: dark ? amber.clone().multiplyScalar(1.7) : new THREE.Color('#fff1b8') },
      },
      vertexShader: ribbonVertex,
      fragmentShader: ribbonFragment,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
  }, [palette]);
  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );
  const mesh = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    const m = mesh.current?.material as THREE.ShaderMaterial | undefined;
    if (!m) return;
    m.uniforms.uProgress.value = progressRef.current ?? 0;
    if (animate) m.uniforms.uTime.value += Math.min(dt, 0.1);
  });
  return <mesh ref={mesh} geometry={geometry} material={material} renderOrder={1} />;
}

/* ── The visitor ────────────────────────────────────────────────────── */

function Visitor({ legs, clockRef, palette, posRef, progressRef }: {
  legs: Leg[];
  clockRef: RefObject<number>;
  palette: ScenePalette;
  posRef: RefObject<THREE.Vector3>;
  progressRef: RefObject<number>;
}) {
  // The visitor's marker is blue so it stands apart from the amber route and towers.
  const visitorBlue = palette.mode === 'dark' ? '#7dd3fc' : '#2563eb';
  const body = useMemo(() => {
    const b = new MeshBuilder();
    person(b, 0, 0, 0, 0, { shirt: visitorBlue, pants: '#1d3557', skin: '#e0ac69', hair: '#2b1d14' }, 'stand', 1.8);
    return b.build();
  }, [visitorBlue]);
  const marker = useMemo(() => {
    const g = new MeshBuilder(palette.glow * 0.9);
    g.torus(0.42, 0.045, 4, 32, { position: [0, 0.06, 0], rotation: [Math.PI / 2, 0, 0], color: visitorBlue });
    return g.build();
  }, [palette.glow, visitorBlue]);
  const pin = useMemo(() => {
    const g = new MeshBuilder(Math.max(1, palette.glow * 0.7));
    g.cone(0.2, 0.45, 12, { position: [0, -0.25, 0], rotation: [Math.PI, 0, 0], color: visitorBlue });
    g.ico(0.21, 2, { position: [0, 0.05, 0], color: visitorBlue });
    g.ico(0.09, 1, { position: [0, 0.07, 0.18], color: '#ffffff' });
    return g.build();
  }, [palette.glow, visitorBlue]);
  // The pin is a map marker: drawn over everything so the visitor is never lost
  // behind a mountain or a show building.
  const pinMaterial = useMemo(() => new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false, depthTest: false, transparent: true }), []);
  useEffect(
    () => () => {
      body.dispose();
      marker.dispose();
      pin.dispose();
      pinMaterial.dispose();
    },
    [body, marker, pin, pinMaterial],
  );
  const group = useRef<THREE.Group>(null);
  const figure = useRef<THREE.Mesh>(null);
  const pinRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock, camera }) => {
    const v = visitorAt(legs, clockRef.current ?? 0);
    progressRef.current = v.progress;
    posRef.current?.set(v.p[0], 0.4, v.p[1]);
    const g = group.current;
    if (!g) return;
    g.position.set(v.p[0], 0.04, v.p[1]);
    if (figure.current) {
      figure.current.rotation.y = Math.atan2(v.dir[0], v.dir[1]);
      figure.current.position.y = v.phase?.kind === 'walk' ? Math.abs(Math.sin(clock.elapsedTime * 9)) * 0.03 : 0;
    }
    if (pinRef.current) {
      // The pin grows with distance so the visitor is easy to find from the whole-park view.
      const far = Math.min(3.4, Math.max(1, camera.position.distanceTo(g.position) / 24));
      const riding = v.phase?.kind === 'ride';
      pinRef.current.position.y = 1.2 + 0.4 * far + Math.sin(clock.elapsedTime * 2.6) * 0.12 * far;
      pinRef.current.rotation.y = clock.elapsedTime * 1.5;
      pinRef.current.scale.setScalar(far * (riding ? 1 + Math.sin(clock.elapsedTime * 6) * 0.15 : 1));
    }
  });
  return (
    <group ref={group}>
      <mesh ref={figure} geometry={body} material={litMaterial()} />
      <mesh geometry={marker} material={glowMaterial()} />
      <mesh ref={pinRef} geometry={pin} material={pinMaterial} renderOrder={10} />
    </group>
  );
}

/* ── Camera ─────────────────────────────────────────────────────────── */

function CameraRig({ view, data, posRef, zoom, instant }: {
  view: View;
  data: ParkData;
  posRef: RefObject<THREE.Vector3>;
  zoom: number;
  instant: boolean;
}) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const controls = useThree((s) => s.controls) as unknown as { target: THREE.Vector3; enabled: boolean } | null;
  const tmp = useMemo(() => ({ goal: new THREE.Vector3(), offset: new THREE.Vector3(), fallback: new THREE.Vector3(0, 0, 3) }), []);
  useFrame((_, delta) => {
    const target = controls?.target ?? tmp.fallback;
    // Narrow (portrait) stages back off so the whole island still fits across.
    const fit = Math.max(1, 1.45 / Math.max(0.3, size.width / Math.max(1, size.height)));
    let dist = PARK_DIST * zoom * fit;
    if (view.kind === 'follow') {
      tmp.goal.copy(posRef.current ?? tmp.fallback);
      dist = 17 * Math.max(0.6, zoom);
    } else if (view.kind === 'ride') {
      const n = data.nodes.find((m) => m.id === view.id);
      if (n) {
        tmp.goal.set(n.x, 1.0, n.z);
        dist = (11 + (n.r ?? 2.5) * (n.scale ?? 1) * 3.2) * Math.max(0.6, zoom);
      }
    } else tmp.goal.set(0, 0, 3);
    const k = instant ? 1 : 1 - Math.exp(-Math.min(delta, 0.1) * 2.6);
    tmp.offset.subVectors(camera.position, target);
    const cur = tmp.offset.length();
    target.lerp(tmp.goal, k);
    tmp.offset.setLength(cur + (dist - cur) * k);
    camera.position.copy(target).add(tmp.offset);
    if (!controls || !controls.enabled) camera.lookAt(target);
  });
  return null;
}

/* ── Labels ─────────────────────────────────────────────────────────── */

/** DOM labels live in an overlay over the canvas; this moves them to their 3D anchors. */
export type LabelEls = RefObject<Map<string, HTMLElement | null>>;
type Anchor = { key: string; pos: [number, number, number]; start?: boolean; below?: boolean };

/** `follow` is a moving anchor (the visitor), read every frame. */
function LabelProjector({ anchors, els, follow }: { anchors: Anchor[]; els: LabelEls; follow?: { key: string; at: RefObject<THREE.Vector3>; lift: number } }) {
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera, size }) => {
    const map = els.current;
    if (!map) return;
    const moving = follow?.at.current;
    const list: Anchor[] = moving ? [...anchors, { key: follow.key, pos: [moving.x, moving.y + follow.lift, moving.z], below: true }] : anchors;
    for (const a of list) {
      const el = map.get(a.key);
      if (!el) continue;
      v.set(a.pos[0], a.pos[1], a.pos[2]).project(camera);
      if (v.z > 1 || v.z < -1) {
        el.style.visibility = 'hidden';
        continue;
      }
      const x = (v.x * 0.5 + 0.5) * size.width;
      const y = (-v.y * 0.5 + 0.5) * size.height;
      // Stop labels hang off to the right of their tower, clear of the visitor at the queue.
      const px = `translate(${(a.start ? x - 11 : x).toFixed(1)}px, ${y.toFixed(1)}px)`;
      el.style.transform = `${px} ${a.start ? 'translate(0, -50%)' : a.below ? 'translate(-50%, 6px)' : 'translate(-50%, -50%)'}`;
      el.style.visibility = 'visible';
    }
  });
  return null;
}

/** Where the scene's labels sit: tower tops, the gate, the hovered ride. */
export function stopTowers(data: ParkData) {
  const byId = new Map(data.nodes.map((n) => [n.id, n]));
  return data.itinerary.map((s, i) => {
    const n = byId.get(s.id)!;
    const [ax, az] = archPoint(n);
    const yaw = n.yaw ?? 0;
    return { i, s, n, x: ax + Math.cos(yaw) * 1.45, z: az - Math.sin(yaw) * 1.45, h: Math.max(0.6, s.queue / 8.5) };
  });
}

/* ── Scene ──────────────────────────────────────────────────────────── */

export default function ParkScene({
  data,
  palette,
  legs,
  clock,
  animate,
  view,
  zoom,
  hovered,
  onHover,
  onSelect,
  labels,
}: {
  data: ParkData;
  palette: ScenePalette;
  legs: Leg[];
  clock: number;
  animate: boolean;
  view: View;
  zoom: number;
  hovered: number | null;
  onHover: (id: number | null) => void;
  onSelect: (id: number) => void;
  labels: LabelEls;
}) {
  const world = useMemo(() => buildParkWorld(data, palette), [data, palette]);
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') console.info(`[park] ${world.vertices} vertices, ${world.movers.length} ride tracks, ${world.spins.length} turning parts`);
  }, [world]);
  useEffect(
    () => () => {
      world.lit.dispose();
      world.glow.dispose();
      world.glass?.dispose();
    },
    [world],
  );

  const clockRef = useRef(clock);
  useEffect(() => {
    clockRef.current = clock;
  }, [clock]);
  const progressRef = useRef(0);
  const posRef = useRef(new THREE.Vector3());

  const byId = useMemo(() => new Map(data.nodes.map((n) => [n.id, n])), [data]);
  const stops = useMemo(() => stopTowers(data), [data]);
  const tower = useMemo(() => {
    const b = new MeshBuilder();
    b.cylinder(0.32, 0.32, 1, 16, { position: [0, 0.5, 0], color: palette.accent.amber });
    return b.build();
  }, [palette]);
  const cap = useMemo(() => {
    const g = new MeshBuilder(Math.max(1, palette.glow * 0.6));
    g.cylinder(0.35, 0.35, 0.07, 16, { color: palette.accent.amber });
    g.torus(0.4, 0.025, 4, 24, { position: [0, -0.035, 0], rotation: [Math.PI / 2, 0, 0], color: palette.accent.amber });
    return g.build();
  }, [palette]);
  const ring = useMemo(() => {
    const g = new MeshBuilder(palette.glow);
    g.torus(1, 0.035, 4, 64, { rotation: [Math.PI / 2, 0, 0], color: palette.mode === 'dark' ? '#ffffff' : palette.accent.amber });
    return g.build();
  }, [palette]);
  useEffect(
    () => () => {
      tower.dispose();
      cap.dispose();
      ring.dispose();
    },
    [tower, cap, ring],
  );

  const hoveredTarget = hovered !== null ? world.targets.find((t) => t.id === hovered) : undefined;
  const hoveredNode = hovered !== null ? byId.get(hovered) : undefined;
  const anchors = useMemo(() => {
    const out: Anchor[] = stops.map((st) => ({ key: `stop-${st.i}`, pos: [st.x, st.h + 0.7, st.z], start: true }));
    out.push({ key: 'gate', pos: [0, 5.3, data.radius] });
    if (hoveredNode) out.push({ key: 'tip', pos: [hoveredNode.x, 3.2 + (hoveredNode.r ?? 2) * 0.6, hoveredNode.z] });
    return out;
  }, [stops, data, hoveredNode]);

  return (
    <group>
      <mesh geometry={world.lit} material={litMaterial()} />
      <mesh geometry={world.glow} material={glowMaterial()} />
      {world.glass && <mesh geometry={world.glass} material={glassMaterial()} renderOrder={2} />}
      <SignBoards specs={world.signs} palette={palette} />
      <RideMovers movers={world.movers} glow={palette.glow} animate={animate} />
      <RideSpins spins={world.spins} animate={animate} />
      <Walkers groups={world.walkers} animate={animate} seed={5} />
      <Fleet specs={world.fleet} palette={palette} animate={animate} seed={9} />

      <RouteRibbon legs={legs} palette={palette} progressRef={progressRef} animate={animate} />
      <Visitor legs={legs} clockRef={clockRef} palette={palette} posRef={posRef} progressRef={progressRef} />

      {stops.map((st) => (
        <group key={st.s.id} position={[st.x, 0.04, st.z]}>
          <mesh geometry={tower} material={glassMaterial()} scale={[1, st.h, 1]} renderOrder={2} />
          <mesh geometry={cap} material={glowMaterial()} position={[0, st.h, 0]} />
        </group>
      ))}

      {hoveredTarget && <mesh geometry={ring} material={glowMaterial()} position={[hoveredTarget.x, 0.1, hoveredTarget.z]} scale={hoveredTarget.r + 0.35} />}

      {world.targets.map((t) => (
        <mesh
          key={t.id}
          position={[t.x, 1.4, t.z]}
          onPointerOver={(e) => {
            e.stopPropagation();
            onHover(t.id);
          }}
          onPointerOut={() => onHover(null)}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(t.id);
          }}
          visible={false}
        >
          <cylinderGeometry args={[t.r, t.r, 2.8, 10]} />
        </mesh>
      ))}

      <LabelProjector anchors={anchors} els={labels} follow={{ key: 'visitor', at: posRef, lift: -0.4 }} />
      <CameraRig view={view} data={data} posRef={posRef} zoom={zoom} instant={!animate} />
    </group>
  );
}
