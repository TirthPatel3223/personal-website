'use client';

import { motion, type Variants } from 'framer-motion';
import { ArrowRight, Trophy, Target, Clock } from 'lucide-react';
import Link from 'next/link';
import type { Project } from '@/data/projects';

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.08,
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
};

const badgeVariants: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: 0.15 + i * 0.04, duration: 0.3, ease: 'easeOut' },
  }),
};

export default function ProjectCard({
  project,
  index = 0,
}: {
  project: Project;
  index?: number;
}) {
  const isComingSoon = project.status === 'coming-soon';

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
      whileHover={
        isComingSoon
          ? {}
          : {
              y: -7,
              transition: { type: 'spring', stiffness: 320, damping: 22 },
            }
      }
      className="group relative glass rounded-[2rem] p-8 overflow-hidden flex flex-col h-full"
      style={{ borderRadius: 'var(--radius-lg)' }}
    >
      {/* Top accent bar – revealed on hover */}
      <div
        className="absolute inset-x-0 top-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-t-[2rem]"
        style={{ background: 'linear-gradient(90deg, var(--accent), var(--accent-hover))' }}
      />

      {/* Background glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at top left, var(--accent-dim) 0%, transparent 60%)',
        }}
      />

      <div className="relative z-10 flex-grow space-y-6">
        <div>
          <div className="flex items-start justify-between gap-3 mb-3">
            <h3
              className="text-xl font-bold tracking-tight leading-snug transition-colors duration-300"
              style={{ color: 'var(--title)' }}
            >
              {project.title}
            </h3>
            {isComingSoon && (
              <span
                className="inline-flex items-center gap-1 text-xs font-semibold rounded-full px-3 py-1 shrink-0"
                style={{
                  background: 'rgba(245, 158, 11, 0.1)',
                  color: '#f59e0b',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                }}
              >
                <Clock className="w-3 h-3" />
                Soon
              </span>
            )}
          </div>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
            {project.short_description}
          </p>
        </div>

        {/* Tech badges */}
        <div className="flex flex-wrap gap-2">
          {project.tech_stack.map((tech, i) => (
            <motion.span
              key={tech}
              custom={i}
              variants={badgeVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="text-xs rounded-full px-3 py-1 transition-colors duration-300"
              style={{
                background: 'var(--accent-dim)',
                color: 'var(--accent)',
                border: '1px solid var(--accent-dim-hover)',
              }}
            >
              {tech}
            </motion.span>
          ))}
        </div>

        <div
          className="space-y-5 pt-4"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <div className="flex gap-4">
            <Target
              className="w-5 h-5 shrink-0 mt-0.5 transition-colors duration-300"
              style={{ color: 'var(--accent)' }}
            />
            <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground)' }}>
              <span
                className="block text-xs uppercase tracking-wider mb-1 font-semibold"
                style={{ color: 'var(--muted)' }}
              >
                Motivation
              </span>
              {project.motivation}
            </p>
          </div>

          <div className="flex gap-4">
            <Trophy
              className="w-5 h-5 shrink-0 mt-0.5 transition-colors duration-300"
              style={{ color: 'var(--accent)' }}
            />
            <div>
              <span
                className="block text-xs uppercase tracking-wider mb-1 font-semibold"
                style={{ color: 'var(--muted)' }}
              >
                Achievements
              </span>
              <ul className="list-disc list-inside space-y-1.5 text-sm" style={{ color: 'var(--foreground)' }}>
                {project.achievements.slice(0, 3).map((ach, i) => (
                  <li key={i}>{ach}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 pt-8 mt-auto">
        {isComingSoon ? (
          <div
            className="inline-flex items-center justify-center gap-2 font-medium px-6 py-3 rounded-full w-full cursor-not-allowed select-none"
            style={{ background: 'var(--accent-dim)', color: 'var(--muted)' }}
          >
            <Clock className="w-4 h-4" />
            Coming Soon
          </div>
        ) : (
          <Link
            href={project.link}
            className="inline-flex items-center justify-center gap-2 font-medium transition-all duration-300 px-6 py-3 rounded-full group/btn w-full"
            style={{
              background: 'var(--accent-dim)',
              color: 'var(--accent)',
              border: '1px solid var(--accent-dim-hover)',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = 'var(--accent)';
              el.style.color = 'white';
              el.style.borderColor = 'var(--accent)';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = 'var(--accent-dim)';
              el.style.color = 'var(--accent)';
              el.style.borderColor = 'var(--accent-dim-hover)';
            }}
          >
            View Project Details
            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform duration-200" />
          </Link>
        )}
      </div>
    </motion.div>
  );
}
