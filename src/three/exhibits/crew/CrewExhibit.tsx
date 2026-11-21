'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import * as THREE from 'three';
import { useScenePalette } from '../../core/palette';
import { useReducedMotion } from '../../core/quality';
import ExhibitCanvas, { useInView } from '../ExhibitCanvas';
import ExhibitShell from '../ExhibitShell';
import { PlayButton, Scrubber, Segmented, Stat } from '../hud';
import CrewNetwork, { crewTones, H, rulerDays } from './CrewNetwork';
import {
  ACTION_LABEL,
  buildIndex,
  CONN_QUICK,
  CONN_REST,
  currentTrip,
  DATASETS,
  formatClock,
  legRoute,
  type CrewReplay,
  type DatasetId,
  type TripView,
} from './crewData';

type Mode = 'auto' | 'playing' | 'paused';
type Speed = '1' | '4' | '16';

/** Decisions per second. At 1x every flight is flown on screen. */
const RATE: Record<Speed, number> = { '1': 2, '4': 8, '16': 32 };
const FLOAT: CSSProperties = { position: 'absolute', left: 0, top: 0, visibility: 'hidden', willChange: 'transform' };
const SHOWN_LEGS = 6;

function waitText(r: CrewReplay, conn: number, buffer: number, critical: boolean) {
  if (buffer < 0) return '';
  if (conn === CONN_REST) return `${Math.round(buffer / 60)} h overnight rest`;
  if (conn === CONN_QUICK) return `${buffer} min quick turn`;
  if (critical) return `${buffer} min on the ground, only ${buffer - r.rules.minSit} min to spare`;
  return `${buffer} min on the ground`;
}

function TripCard({ replay, trip, colors }: { replay: CrewReplay; trip: TripView; colors: ReturnType<typeof crewTones> }) {
  const base = replay.airports[trip.base] ?? 'its base';
  const rows = trip.steps.map((s, i) => {
    const [, , leg, dh, , , , conn, buffer, crit] = replay.steps[s];
    return { i, leg, dh: dh === 1, wait: i === 0 ? '' : waitText(replay, conn, buffer, crit === 1), crit: crit === 1 };
  });
  const hidden = Math.max(0, rows.length - SHOWN_LEGS);
  const heading = trip.status === 'finished' ? 'Trip finished' : trip.status === 'dropped' ? 'Trip dropped' : 'Trip being built';
  return (
    <div>
      <p className="hud-mini">{heading}</p>
      <p className="crew-trip-head">
        Trip {trip.pairing} <span>· home base {base}</span>
      </p>
      <ol className="crew-itin">
        {hidden > 0 && (
          <li className="crew-itin-more">
            {hidden} earlier flight{hidden === 1 ? '' : 's'}
          </li>
        )}
        {rows.slice(hidden).map((row) => (
          <li key={row.i}>
            {row.wait && (
              <span className="crew-itin-wait" style={row.crit ? { color: colors.critical } : undefined}>
                {row.wait}
              </span>
            )}
            <span className="crew-itin-leg">
              <span className="crew-itin-num">{row.i + 1}</span>
              <strong>{legRoute(replay, row.leg).replace(' to ', ' → ')}</strong>
              <span className="crew-itin-time">{formatClock(replay.legs[row.leg][2])}</span>
            </span>
            {row.dh && (
              <span className="crew-itin-wait" style={{ color: colors.ride }}>
                Rides as a passenger: covers nothing
              </span>
            )}
          </li>
        ))}
        {trip.status === 'finished' && <li className="crew-itin-end">Back home at {base}. Trip finished.</li>}
        {trip.status === 'dropped' && (
          <li className="crew-itin-end" style={{ color: colors.dropped[0] }}>
            No legal way to finish it at {base}, so the trip is dropped and its flights stay uncovered.
          </li>
        )}
      </ol>
    </div>
  );
}

export default function CrewExhibit({ quality }: { quality: 'low' | 'high' }) {
  const palette = useScenePalette();
  const tones = crewTones(palette);
  const reduced = useReducedMotion();
  const [wrapRef, inView] = useInView<HTMLDivElement>();
  const [dataset, setDataset] = useState<DatasetId>('cockpit-beam');
  const [replays, setReplays] = useState<Partial<Record<DatasetId, CrewReplay>>>({});
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<Mode>('auto');
  const [speed, setSpeed] = useState<Speed>('1');
  const [showAlt, setShowAlt] = useState(true);
  const replay = replays[dataset];
  const index = useMemo(() => (replay ? buildIndex(replay) : null), [replay]);
  const total = replay?.steps.length ?? 0;
  const done = !!replay && step >= total;
  const playing = !!replay && !done && (mode === 'playing' || (mode === 'auto' && inView && !reduced));
  const target = useMemo(() => new THREE.Vector3(0, H * 0.46, 0), []);

  useEffect(() => {
    if (replays[dataset]) return;
    let cancelled = false;
    fetch(`/data/crew/${dataset}.json`)
      .then((r) => r.json())
      .then((d: CrewReplay) => {
        if (!cancelled) setReplays((prev) => ({ ...prev, [dataset]: d }));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [dataset, replays]);

  useEffect(() => {
    if (!playing || !replay) return;
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const rate = RATE[speed];
    const tick = (now: number) => {
      acc += ((now - last) / 1000) * rate;
      last = now;
      if (acc >= 1) {
        const n = Math.floor(acc);
        acc -= n;
        setStep((s) => Math.min(replay.steps.length, s + n));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, replay, speed]);

  const trip = useMemo(() => (replay && index ? currentTrip(replay, index, step) : null), [replay, index, step]);
  const last = replay && step > 0 ? replay.steps[step - 1] : null;
  const coverage = last ? last[4] / 1e5 : 0;
  const flyingLeg = replay && trip && trip.steps.length ? replay.steps[trip.steps[trip.steps.length - 1]][2] : -1;
  // Ruler labels step aside when the "now" tag sits on top of them.
  const nowDay = replay && flyingLeg >= 0 ? replay.legs[flyingLeg][2] / 1440 + 1 : -1;
  const hot = useMemo(() => {
    const s = new Set<number>();
    if (!replay || !trip) return s;
    s.add(trip.base);
    for (const st of trip.steps) {
      const leg = replay.steps[st][2];
      s.add(replay.legs[leg][0]);
      s.add(replay.legs[leg][1]);
    }
    return s;
  }, [replay, trip]);

  const labelEls = useRef(new Map<string, HTMLElement | null>());
  const label = useCallback((key: string) => (el: HTMLElement | null) => {
    labelEls.current.set(key, el);
  }, []);

  const toggle = () => {
    if (done) {
      setStep(0);
      setMode('playing');
    } else setMode(playing ? 'paused' : 'playing');
  };

  const swatch = (color: string, alpha = 1, dashed = false) => (
    <i
      aria-hidden="true"
      className={dashed ? 'crew-key-line crew-key-dash' : 'crew-key-line'}
      style={dashed ? { color, opacity: alpha } : { background: color, opacity: alpha }}
    />
  );
  const altsOn = showAlt && speed !== '16';
  const key = (
    <>
      <span>
        <i aria-hidden="true" className="crew-key-pillar" style={{ background: tones.base }} /> Crew base
      </span>
      <span>
        <i aria-hidden="true" className="crew-key-dot" style={{ background: tones.pole }} /> Airport
      </span>
      <span>{swatch(tones.active)} Trip being built</span>
      <span>{swatch(tones.critical)} Critical connection</span>
      <span>{swatch(tones.ride, 1, true)} Crew rides as passengers</span>
      <span>{swatch(tones.covered[0], 0.85)} Flight covered</span>
      <span>{swatch(tones.waiting[0], 0.6)} Not covered yet</span>
      <span>{swatch(tones.dropped[0], 0.85)} Trip dropped</span>
      {altsOn && <span>{swatch(tones.option, 0.9, true)} Option it passed on</span>}
    </>
  );

  const side = (
    <div className="space-y-5">
      <div className="crew-key crew-key-inline" aria-label="Key">
        {key}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Flights covered" value={`${(coverage * 100).toFixed(1)}%`} />
        <Stat label="Trips finished" value={index ? index.finished[step] : 0} />
        <Stat label="Critical connections" value={index ? index.critical[step] : 0} color={tones.critical} />
        <Stat label="Trips dropped" value={index ? index.dropped[step] : 0} color={tones.dropped[0]} />
      </div>
      {done && replay ? (
        <div>
          <p className="hud-mini">The finished month</p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground)' }}>
            {replay.summary.covered} of {replay.summary.legs} flights covered ({(replay.summary.coverage * 100).toFixed(1)}%), every trip legal. Blue
            lines are covered flights and grey ones were left uncovered. The {replay.summary.critical} red ones follow a connection with under{' '}
            {replay.rules.critSlack} minutes to spare.
          </p>
        </div>
      ) : replay && trip ? (
        <TripCard replay={replay} trip={trip} colors={tones} />
      ) : (
        <div>
          <p className="hud-mini">How it works</p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground)' }}>
            The agent builds one crew trip at a time. It picks a first flight out of a base, keeps choosing the next flight from wherever the crew
            lands, and has to bring the crew home. Press play to watch.
          </p>
        </div>
      )}
      {replay && last && last[5].length > 0 && (
        <div>
          <p className="hud-mini">What it weighed</p>
          <ul className="hud-options">
            {last[5].map(([action, leg, q, chosen], i) => (
              <li key={i} data-chosen={chosen === 1}>
                <span>
                  {ACTION_LABEL[action] ?? 'Option'} {leg >= 0 ? legRoute(replay, leg).replace(' to ', ' → ') : ''}
                </span>
                <span className="tabular-nums">{(q / 1000).toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <p className="hud-note">Scores are the network&apos;s estimate of future reward. The search looks ahead, so it does not always take the top score.</p>
        </div>
      )}
    </div>
  );

  const hud = (
    <>
      <PlayButton playing={playing} onToggle={toggle} disabled={!replay} />
      <Segmented<Speed>
        label="Playback speed"
        value={speed}
        options={[
          { value: '1', label: '1x' },
          { value: '4', label: '4x' },
          { value: '16', label: '16x' },
        ]}
        onChange={setSpeed}
      />
      <div className="hud-grow">
        <Scrubber
          label="Replay position"
          value={step}
          max={total}
          onChange={(v) => {
            setMode('paused');
            setStep(v);
          }}
        />
      </div>
      <span className="hud-count tabular-nums">
        Decision {step} of {total || '...'}
      </span>
      <Segmented<DatasetId>
        label="Replay"
        value={dataset}
        options={DATASETS.map((d) => ({ value: d.id, label: d.label }))}
        onChange={(id) => {
          setDataset(id);
          setStep(0);
          setMode('auto');
        }}
      />
      <label className="hud-check">
        <input type="checkbox" checked={showAlt} onChange={(e) => setShowAlt(e.target.checked)} /> Show options it passed on
      </label>
    </>
  );

  return (
    <div ref={wrapRef}>
      <ExhibitShell
        kicker="Airport · interactive replay"
        title="Watch the agent build a month of crew schedules"
        accent={palette.accent.blue}
        side={side}
        hud={hud}
        stageHeight="clamp(380px, min(72vh, 100vw), 760px)"
        caption="The three crew bases are the pillars in the middle and the ring is the 23 airports they fly to. Each line is one real flight from the month, placed at its day: Day 1 is the floor and time runs upward. Airport names are anonymized in the data, so their places on the ring are schematic."
      >
        <ExhibitCanvas quality={quality} camera={[9, 22, 40]} target={[target.x, target.y, target.z]} environment={false}>
          <color attach="background" args={[tones.background]} />
          <ambientLight intensity={0.7} />
          <directionalLight position={[10, 24, 12]} intensity={1.3} />
          {replay && index && (
            <CrewNetwork
              replay={replay}
              index={index}
              step={step}
              palette={palette}
              showAlternatives={altsOn}
              flightSeconds={reduced ? 0 : Math.min(0.42, 0.85 / RATE[speed])}
              labels={labelEls}
              target={target}
            />
          )}
        </ExhibitCanvas>

        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          {replay?.airports.map((name, i) => {
            const isBase = replay.bases.includes(i);
            return (
              <span
                key={name}
                ref={label(`apt-${i}`)}
                className={isBase ? 'crew-label crew-label-base' : 'crew-label crew-label-apt'}
                data-on={hot.has(i)}
                style={FLOAT}
              >
                {name}
              </span>
            );
          })}
          {index &&
            rulerDays(index.days).map((d) => (
              <span
                key={d}
                ref={label(`day-${d}`)}
                className="crew-label crew-label-dim crew-label-day"
                style={{ ...FLOAT, opacity: nowDay > 0 && Math.abs(nowDay - d) < 2.2 ? 0 : 1 }}
              >
                Day {d}
              </span>
            ))}
          <span ref={label('now')} className="crew-label crew-label-now crew-label-day" style={FLOAT}>
            {replay && flyingLeg >= 0 ? formatClock(replay.legs[flyingLeg][2]) : ''}
          </span>
          <span ref={label('plane')} className="crew-label crew-label-plane" style={FLOAT}>
            {trip ? `Trip ${trip.pairing}` : ''}
          </span>
        </div>

        <div className="crew-key crew-key-overlay">{key}</div>
      </ExhibitShell>
    </div>
  );
}
