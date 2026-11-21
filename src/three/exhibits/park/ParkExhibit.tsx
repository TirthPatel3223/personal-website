'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { ZoomIn, ZoomOut } from 'lucide-react';
import { useScenePalette } from '../../core/palette';
import { useReducedMotion } from '../../core/quality';
import ExhibitCanvas, { useInView } from '../ExhibitCanvas';
import ExhibitShell from '../ExhibitShell';
import { PlayButton, Scrubber, Segmented, Stat } from '../hud';
import ParkScene, { KIND_LABEL, type View } from './ParkScene';
import { buildDay, dayEnd, displayName, formatClock, phaseAt, type ParkData, type Phase } from './parkData';

type Mode = 'route' | 'forecast';
type Play = 'auto' | 'playing' | 'paused';
type Speed = '1' | '2' | '4';

/** Sim minutes per real second at 1x, and how fast the visitor walks on screen. */
const RATE = 6;
const WALK_UNITS_PER_SEC = 6;

/** Labels float over the canvas; the scene moves them to their 3D anchors every frame. */
const FLOAT: CSSProperties = { position: 'absolute', left: 0, top: 0, visibility: 'hidden', willChange: 'transform' };

function phaseText(p: Phase | null) {
  if (!p) return 'Loading the park...';
  const name = p.leg.name;
  switch (p.kind) {
    case 'walk':
      return p.leg.node ? `Walking to ${name}: ${p.leg.walk.toFixed(1)} min on foot` : `Walking back to the gate: ${p.leg.walk.toFixed(1)} min`;
    case 'wait':
      return p.lunch ? 'Lunch break, 1:00 to 2:00 PM' : `Waiting for the planned slot at ${name}`;
    case 'queue':
      return `Queueing for ${name}: ${p.leg.queue} min forecast`;
    case 'ride':
      return `Riding ${name}: ${p.leg.ride} min`;
    case 'done':
      return 'Back at the gate: 7 rides, all 3 must-dos.';
  }
}

function ParkExhibit({ quality, mode }: { quality: 'low' | 'high'; mode: Mode }) {
  const palette = useScenePalette();
  const reduced = useReducedMotion();
  const [wrapRef, inView] = useInView<HTMLDivElement>();
  const [data, setData] = useState<ParkData | null>(null);
  const [clock, setClock] = useState(0);
  const [play, setPlay] = useState<Play>('auto');
  const [speed, setSpeed] = useState<Speed>('2');
  const [hovered, setHovered] = useState<number | null>(null);
  const [view, setView] = useState<View>({ kind: 'park' });
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    let cancelled = false;
    fetch('/data/park/disneyland.json')
      .then((r) => r.json())
      .then((d: ParkData) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const legs = useMemo(() => (data ? buildDay(data) : []), [data]);

  // Test hooks (development only): drive the exhibit from the console.
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    const w = window as unknown as Record<string, unknown>;
    w.__parkView = setView;
    w.__parkClock = (t: number) => {
      setPlay('paused');
      setClock(t);
    };
    w.__parkZoom = setZoom;
  }, []);
  const end = dayEnd(legs);
  const done = end > 0 && clock >= end;
  const playing = end > 0 && !done && (play === 'playing' || (play === 'auto' && inView && !reduced));

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const sp = Number(speed);
    const tick = (now: number) => {
      const dt = Math.min(0.25, (now - last) / 1000);
      last = now;
      setClock((c) => {
        const ph = phaseAt(legs, c);
        let rate = sp * RATE;
        // Walks are a minute or two of the day but cross the whole park on screen:
        // slow the clock while walking so the route can be followed.
        if (ph?.kind === 'walk') rate = Math.min(rate, ph.leg.walk / Math.max(0.4, ph.leg.length / (WALK_UNITS_PER_SEC * sp)));
        return Math.min(end, c + dt * rate);
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed, end, legs]);

  const phase = phaseAt(legs, clock);
  const current = phase ? phase.leg.stop : -1;

  const toggle = () => {
    if (done) {
      setClock(0);
      setPlay('playing');
    } else setPlay(playing ? 'paused' : 'playing');
  };

  const focusRide = (id: number) => setView((v) => (v.kind === 'ride' && v.id === id ? { kind: 'park' } : { kind: 'ride', id }));

  const rows = legs.map((leg, i) => {
    const isGate = !leg.node;
    const id = leg.node?.id ?? 0;
    const active = !done && i === current;
    const focused = view.kind === 'ride' && view.id === id && !isGate;
    return (
      <li key={i} data-current={active} data-focused={focused}>
        <button type="button" className="park-stop-btn" onClick={() => (isGate ? setView({ kind: 'park' }) : focusRide(id))}>
          <span className="park-stop-num">{isGate ? '★' : i + 1}</span>
          <span className="park-stop-name">{isGate ? 'Back to the gate' : leg.name}</span>
          <span className="park-stop-meta tabular-nums">
            {isGate ? formatClock(leg.arrive) : mode === 'route' ? formatClock(leg.arrive) : `${leg.queue} min`}
          </span>
        </button>
      </li>
    );
  });

  const stopList = (
    <ol className="park-stops">
      <li data-current={false}>
        <button type="button" className="park-stop-btn" onClick={() => setView({ kind: 'park' })}>
          <span className="park-stop-num">★</span>
          <span className="park-stop-name">Gate</span>
          <span className="park-stop-meta tabular-nums">9:00 AM</span>
        </button>
      </li>
      {rows}
    </ol>
  );

  const clockBlock = (
    <div>
      <p className="park-clock tabular-nums" aria-live="off">
        {formatClock(clock)}
      </p>
      <p className="text-sm" style={{ color: 'var(--foreground)' }}>
        {phaseText(phase)}
      </p>
    </div>
  );

  const side =
    mode === 'route' ? (
      <div className="space-y-5">
        {clockBlock}
        {stopList}
        <p className="hud-note">
          The plan starts and ends at the gate and finishes its last ride at 2:48 PM, 130 minutes earlier than the old objective&apos;s plan for
          the same day. Click a stop to look closer.
        </p>
      </div>
    ) : (
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Champion error" value="7.01 min" sub="vs. 9.51 baseline" />
          <Stat label="Within 10 min" value="76.6%" sub="up from 64.5%" />
        </div>
        {clockBlock}
        <div>
          <p className="hud-mini">Forecast queue when the route arrives</p>
          {stopList}
        </div>
        <p className="hud-note">The forecasts cover 109 rides in 5 parks. Click a stop, or any ride in the park, to look closer.</p>
      </div>
    );

  const hud = (
    <>
      <PlayButton playing={playing} onToggle={toggle} disabled={!data} />
      <Segmented<Speed>
        label="Playback speed"
        value={speed}
        options={[
          { value: '1', label: '1x' },
          { value: '2', label: '2x' },
          { value: '4', label: '4x' },
        ]}
        onChange={setSpeed}
      />
      <div className="hud-grow">
        <Scrubber
          label="Time of day"
          value={Math.round(clock)}
          max={Math.ceil(end)}
          onChange={(v) => {
            setPlay('paused');
            setClock(v);
          }}
        />
      </div>
      <span className="hud-count tabular-nums">{formatClock(clock)}</span>
      <Segmented<'park' | 'follow' | 'ride'>
        label="Camera"
        value={view.kind}
        options={[
          { value: 'park', label: 'Whole park' },
          { value: 'follow', label: 'Follow visitor' },
        ]}
        onChange={(v) => setView(v === 'follow' ? { kind: 'follow' } : { kind: 'park' })}
      />
      <div className="hud-seg" role="group" aria-label="Zoom">
        <button type="button" className="hud-seg-btn" aria-label="Zoom in" onClick={() => setZoom((z) => Math.max(0.3, z * 0.75))}>
          <ZoomIn className="w-4 h-4" />
        </button>
        <button type="button" className="hud-seg-btn" aria-label="Zoom out" onClick={() => setZoom((z) => Math.min(1.15, z / 0.75))}>
          <ZoomOut className="w-4 h-4" />
        </button>
      </div>
    </>
  );

  const hoveredNode = hovered !== null && data ? data.nodes.find((n) => n.id === hovered) : undefined;
  const hoveredStop = hoveredNode && data ? data.itinerary.findIndex((s) => s.id === hoveredNode.id) : -1;
  const labelEls = useRef(new Map<string, HTMLElement | null>());
  const label = useCallback((key: string) => (el: HTMLElement | null) => {
    labelEls.current.set(key, el);
  }, []);

  return (
    <div ref={wrapRef}>
      <ExhibitShell
        kicker={mode === 'route' ? 'Theme Park · the planned day' : 'Theme Park · forecast queues'}
        title={mode === 'route' ? "Follow the solver's plan through the park" : 'The forecast queues the solver plans around'}
        accent={palette.accent.amber}
        side={side}
        hud={hud}
        stageHeight="clamp(360px, min(72vh, 108vw), 760px)"
        caption={
          mode === 'route'
            ? "All 41 rides in the solver's Disneyland data, each in its own plot. Positions loosely follow walking times, spread out so every ride shows: it is not a map, and the models are generic ride types. The glowing route, stop order, times, walking minutes and queue forecasts are the solver's real example day."
            : "All 41 rides in the solver's Disneyland data. Positions loosely follow walking times (not a map) and the models are generic ride types. The glowing route is the solver's example day; each tower is the forecast queue when the route reaches that ride. The live dashboard below has every ride."
        }
      >
        <ExhibitCanvas quality={quality} camera={[0, 52, 68.5]} target={[0, 0, 3]} cloudSpread={95} seaLevel={-34}>
          {data && (
            <ParkScene
              data={data}
              palette={palette}
              legs={legs}
              clock={clock}
              animate={!reduced}
              view={view}
              zoom={zoom}
              hovered={hovered}
              onHover={setHovered}
              onSelect={focusRide}
              labels={labelEls}
            />
          )}
        </ExhibitCanvas>
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          {data?.itinerary.map((s, i) => (
            <span key={s.id} ref={label(`stop-${i}`)} className="park-label" style={FLOAT}>
              <span className="park-label-num">{i + 1}</span> {s.queue} min
            </span>
          ))}
          {data && (
            <span ref={label('visitor')} className="park-label" style={{ ...FLOAT, color: palette.mode === 'dark' ? '#bae6fd' : '#1d4ed8' }}>
              <span className="park-label-num" style={{ background: palette.mode === 'dark' ? '#7dd3fc' : '#2563eb', color: palette.mode === 'dark' ? '#0b1020' : '#ffffff' }}>
                ●
              </span>
              Visitor
            </span>
          )}
          {data && (
            <span ref={label('gate')} className="park-label" style={FLOAT}>
              <span className="park-label-num">★</span> Start &amp; finish
            </span>
          )}
          {hoveredNode && (
            <div ref={label('tip')} className="park-tip" style={FLOAT}>
              <strong>{displayName(hoveredNode.name)}</strong>
              <span>
                {KIND_LABEL[hoveredNode.kind]}
                {hoveredNode.duration ? `, ${hoveredNode.duration} min ride` : ''}
              </span>
              {hoveredStop >= 0 && <span>Stop {hoveredStop + 1} of the planned day</span>}
              <span className="park-tip-hint">Click to look closer</span>
            </div>
          )}
        </div>
        {hoveredNode && <span className="sr-only" aria-live="polite">{displayName(hoveredNode.name)}</span>}
      </ExhibitShell>
    </div>
  );
}

export function RouteExhibit({ quality }: { quality: 'low' | 'high' }) {
  return <ParkExhibit quality={quality} mode="route" />;
}

export function ForecastExhibit({ quality }: { quality: 'low' | 'high' }) {
  return <ParkExhibit quality={quality} mode="forecast" />;
}
