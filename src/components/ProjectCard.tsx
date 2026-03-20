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
      className="group relative bg-neutral-900/40 border border-neutral-800 rounded-[2rem] p-8 hover:border-teal-500/40 transition-colors duration-500 overflow-hidden flex flex-col h-full"
    >
      {/* Top accent bar – revealed on hover */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-t-[2rem]" />

      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-500/[0.07] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

      {/* Subtle inner shadow to separate card from page */}
      <div className="absolute inset-0 rounded-[2rem] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] pointer-events-none" />

      <div className="relative z-10 flex-grow space-y-6">
        <div>
          <div className="flex items-start justify-between gap-3 mb-3">
            <h3 className="text-xl font-bold text-neutral-100 tracking-tight leading-snug group-hover:text-white transition-colors duration-300">
              {project.title}
            </h3>
            {isComingSoon && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full px-3 py-1 shrink-0">
                <Clock className="w-3 h-3" />
                Soon
              </span>
            )}
          </div>
          <p className="text-neutral-400 text-sm leading-relaxed">{project.short_description}</p>
        </div>

        {/* Tech badges with stagger */}
        <div className="flex flex-wrap gap-2">
          {project.tech_stack.map((tech, i) => (
            <motion.span
              key={tech}
              custom={i}
              variants={badgeVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="text-xs bg-teal-500/10 text-teal-300 border border-teal-500/20 rounded-full px-3 py-1 group-hover:bg-teal-500/15 group-hover:border-teal-500/30 transition-colors duration-300"
            >
              {tech}
            </motion.span>
          ))}
        </div>

        <div className="space-y-5 pt-4 border-t border-neutral-800/50">
          <div className="flex gap-4">
            <Target className="w-5 h-5 text-teal-400 shrink-0 mt-0.5 group-hover:text-teal-300 transition-colors duration-300" />
            <p className="text-neutral-300 text-sm leading-relaxed">
              <span className="text-neutral-500 block text-xs uppercase tracking-wider mb-1 font-semibold">
                Motivation
              </span>
              {project.motivation}
            </p>
          </div>

          <div className="flex gap-4">
            <Trophy className="w-5 h-5 text-teal-400 shrink-0 mt-0.5 group-hover:text-teal-300 transition-colors duration-300" />
            <div>
              <span className="text-neutral-500 block text-xs uppercase tracking-wider mb-1 font-semibold">
                Achievements
              </span>
              <ul className="list-disc list-inside space-y-1.5 text-neutral-300 text-sm">
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
          <div className="inline-flex items-center justify-center gap-2 bg-neutral-800/50 text-neutral-500 font-medium px-6 py-3 rounded-full w-full cursor-not-allowed select-none">
            <Clock className="w-4 h-4" />
            Coming Soon
          </div>
        ) : (
          <Link
            href={project.link}
            className="inline-flex items-center justify-center gap-2 bg-teal-500/10 text-teal-400 font-medium hover:bg-teal-500 hover:text-neutral-950 transition-all duration-300 px-6 py-3 rounded-full group/btn w-full border border-teal-500/20 hover:border-teal-500"
          >
            View Project Details
            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform duration-200" />
          </Link>
        )}
      </div>
    </motion.div>
  );
}
