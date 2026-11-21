'use client';

import { Pause, Play, RotateCcw } from 'lucide-react';
import type { ReactNode } from 'react';

/* Small, keyboard-accessible controls shared by the exhibit HUDs. */

export function PlayButton({ playing, onToggle, disabled }: { playing: boolean; onToggle: () => void; disabled?: boolean }) {
  return (
    <button type="button" className="hud-btn hud-btn-primary" onClick={onToggle} disabled={disabled} aria-label={playing ? 'Pause' : 'Play'}>
      {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      {playing ? 'Pause' : 'Play'}
    </button>
  );
}

export function ResetButton({ onClick, label = 'Restart' }: { onClick: () => void; label?: string }) {
  return (
    <button type="button" className="hud-btn" onClick={onClick}>
      <RotateCcw className="w-4 h-4" />
      {label}
    </button>
  );
}

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (v: T) => void;
}) {
  return (
    <div className="hud-seg" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          className="hud-seg-btn"
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Stat({ label, value, sub, color }: { label: string; value: ReactNode; sub?: ReactNode; color?: string }) {
  return (
    <div className="hud-stat">
      <span className="hud-stat-value" style={color ? { color } : undefined}>
        {value}
      </span>
      <span className="hud-stat-label">{label}</span>
      {sub && <span className="hud-stat-sub">{sub}</span>}
    </div>
  );
}

export function Scrubber({
  label,
  value,
  max,
  onChange,
}: {
  label: string;
  value: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <input
      type="range"
      className="hud-range"
      aria-label={label}
      min={0}
      max={max}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  );
}
