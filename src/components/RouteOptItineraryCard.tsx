'use client';

import { motion, type Variants } from 'framer-motion';
import { CalendarClock, Terminal } from 'lucide-react';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

/* Verbatim from the repo README's worked example: Disneyland, 2026-08-25, a 09:00
   start, a 480-minute budget, three must-do rides, three wants, and a 13:00-14:00
   break. Queue minutes are the forecast for the slot the plan arrives in. */
const STOPS = [
  { n: 1, arrive: '09:07 AM', ride: "Tiana's Bayou Adventure", queue: 13, dur: 11, must: false },
  { n: 2, arrive: '09:33 AM', ride: 'Matterhorn Bobsleds', queue: 23, dur: 2, must: false },
  { n: 3, arrive: '10:00 AM', ride: 'Pirates of the Carbbean', queue: 18, dur: 16, must: false },
  { n: 4, arrive: '10:35 AM', ride: 'Big Thunder Mountain Railroad', queue: 27, dur: 4, must: false },
  { n: 5, arrive: '11:09 AM', ride: 'Space Mountain', queue: 40, dur: 3, must: true },
  { n: 6, arrive: '11:53 AM', ride: 'Star Wars: Rise of the Resistance', queue: 49, dur: 18, must: true },
  { n: 7, arrive: '02:00 PM', ride: 'Indiana Jones Adventure', queue: 45, dur: 4, must: true },
];

const TOTAL = 350;

/* The README reports 57 riding / 215 queueing / 19 walking. The remaining 59 minutes
   of a 350-minute day are the 13:00-14:00 break and the idling the solver chose. */
const SPLIT = [
  { label: 'Queueing', minutes: 215, cls: 'routeopt-seg-queue' },
  { label: 'Riding', minutes: 57, cls: 'routeopt-seg-ride' },
  { label: 'Walking', minutes: 19, cls: 'routeopt-seg-walk' },
  { label: 'Idle & break', minutes: 59, cls: 'routeopt-seg-idle' },
];

const STATS = [
  { label: 'Finishes', value: '02:48 PM' },
  { label: 'Total', value: '350 min' },
  { label: 'Rides', value: '7 (3 must-do)' },
];

export default function RouteOptItineraryCard() {
  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <h2
          className="section-title text-2xl font-bold tracking-tight"
          style={{ color: 'var(--title)' }}
        >
          A Solved Day
        </h2>
        <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
      </div>

      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        whileHover={{ y: -5, transition: { type: 'spring', stiffness: 320, damping: 22 } }}
        className="glass border routeopt-accent-border rounded-2xl overflow-hidden home-card"
      >
        {/* Command strip */}
        <div
          className="flex items-center gap-2 px-5 py-3"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <Terminal className="w-4 h-4 routeopt-accent-text shrink-0" />
          <span className="text-xs font-mono truncate" style={{ color: 'var(--muted)' }}>
            mapblazer --park disneyland --start 09:00 --budget 480 --break 13:00-14:00
          </span>
        </div>

        <div className="p-5 space-y-6">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <CalendarClock className="w-4 h-4 routeopt-accent-text" />
            <span className="font-semibold text-sm" style={{ color: 'var(--title)' }}>
              Disneyland &middot; Tuesday 25 August 2026
            </span>
            <div className="flex flex-wrap gap-2">
              {STATS.map((s) => (
                <span
                  key={s.label}
                  className="text-xs rounded-full px-3 py-1 border routeopt-accent-bg routeopt-accent-border routeopt-accent-text font-medium whitespace-nowrap"
                >
                  {s.label} {s.value}
                </span>
              ))}
            </div>
          </div>

          {/* Where the 350 minutes went */}
          <div>
            <div className="flex h-3 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
              {SPLIT.map((s) => (
                <div
                  key={s.label}
                  className={s.cls}
                  style={{ width: `${(s.minutes / TOTAL) * 100}%` }}
                  title={`${s.label}: ${s.minutes} min`}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-3">
              {SPLIT.map((s) => (
                <span key={s.label} className="flex items-center gap-2 text-xs" style={{ color: 'var(--muted)' }}>
                  <span className={`w-2.5 h-2.5 rounded-sm ${s.cls}`} />
                  {s.label} <span className="font-mono" style={{ color: 'var(--foreground)' }}>{s.minutes}m</span>
                </span>
              ))}
            </div>
          </div>

          {/* Wide table scrolls inside its own container rather than the page */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: 560, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['#', 'Arrive', 'Ride', 'Queue', 'Ride time'].map((h, i) => (
                    <th
                      key={h}
                      className={`pb-3 text-xs uppercase tracking-wider font-semibold whitespace-nowrap ${
                        i >= 3 ? 'text-right px-3' : 'text-left pr-4'
                      }`}
                      style={{ color: 'var(--muted)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {STOPS.map((s) => (
                  <tr
                    key={s.n}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      background: s.must ? 'var(--accent-dim)' : undefined,
                    }}
                  >
                    <td className="py-3 pr-4 font-mono text-xs" style={{ color: 'var(--muted)' }}>
                      {s.n}
                    </td>
                    <td className="py-3 pr-4 font-mono whitespace-nowrap" style={{ color: 'var(--foreground)' }}>
                      {s.arrive}
                    </td>
                    <td className="py-3 pr-4">
                      <span style={{ color: 'var(--title)' }}>{s.ride}</span>
                      {s.must && (
                        <span className="ml-2 text-[10px] font-bold uppercase tracking-wider routeopt-accent-text">
                          must-do
                        </span>
                      )}
                    </td>
                    <td
                      className={`text-right px-3 py-3 font-mono whitespace-nowrap ${
                        s.must ? 'font-bold routeopt-accent-text' : ''
                      }`}
                      style={s.must ? undefined : { color: 'var(--foreground)' }}
                    >
                      {s.queue} min
                    </td>
                    <td className="text-right px-3 py-3 font-mono whitespace-nowrap" style={{ color: 'var(--muted)' }}>
                      {s.dur} min
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* What the plan is actually doing */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border routeopt-accent-border routeopt-accent-bg p-4">
              <p className="text-xs uppercase tracking-wider font-semibold routeopt-accent-text mb-1.5">
                Cheap queues first
              </p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground)' }}>
                The four optional rides are cleared before 11 AM while their queues are still
                short, and the three must-dos are paid for later, once the morning is spent.
              </p>
            </div>
            <div className="rounded-xl border routeopt-accent-border routeopt-accent-bg p-4">
              <p className="text-xs uppercase tracking-wider font-semibold routeopt-accent-text mb-1.5">
                Idling on purpose
              </p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground)' }}>
                Indiana Jones lands at 2:00 PM, after the break, because the solver would rather
                sit through it than pay the morning queue. The day still ends at 2:48 PM rather
                than sprawling to closing time, since the objective charges for every minute.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
