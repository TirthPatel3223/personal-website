'use client';

import { motion, type Variants } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Chat from '@/components/Chat';
import ProjectCard from '@/components/ProjectCard';
import { projects } from '@/data/projects';
import { Github, Linkedin, Mail, FileText, MapPin } from 'lucide-react';

const skills: Record<string, string[]> = {
  Languages: ['Python', 'SQL', 'R', 'JavaScript', 'TypeScript'],
  'ML / AI': ['PyTorch', 'TensorFlow', 'scikit-learn', 'Hugging Face', 'LLMs & RAG'],
  'Data Engineering': ['PySpark', 'Snowflake', 'Airflow', 'dbt', 'Kafka'],
  Analytics: ['Tableau', 'Power BI', 'Pandas', 'NumPy', 'Matplotlib'],
  Tools: ['Git', 'Docker', 'AWS', 'GCP', 'Jupyter'],
};

/* ─── Shared animation variants ────────────────────────────────────── */
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay, duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const sectionHeading: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

/* ─── Hero text stagger variants ───────────────────────────────────── */
const heroContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const heroItem: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 selection:bg-teal-500/30 font-sans">
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section
        id="hero"
        className="relative flex flex-col items-center justify-center min-h-screen px-4 pt-16 overflow-hidden"
      >
        {/* Background glows */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.4 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-teal-500/8 rounded-full blur-[140px] pointer-events-none"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.8, delay: 0.3 }}
          className="absolute top-1/4 right-1/3 w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none"
        />

        {/* Hero text group — staggered */}
        <motion.div
          variants={heroContainer}
          initial="hidden"
          animate="visible"
          className="z-10 text-center space-y-6 max-w-4xl"
        >
          <motion.p variants={heroItem} className="text-teal-400 text-sm font-semibold uppercase tracking-[0.2em]">
            Portfolio
          </motion.p>

          <motion.h1
            variants={heroItem}
            className="text-5xl sm:text-6xl md:text-8xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-teal-300 via-emerald-400 to-teal-600"
          >
            Tirth Patel
          </motion.h1>

          <motion.p variants={heroItem} className="text-base sm:text-xl md:text-2xl text-neutral-400 font-light max-w-2xl mx-auto leading-relaxed">
            Data Scientist &amp; ML Engineer
            <br />
            <span className="text-neutral-500 text-sm sm:text-lg">MSBA @ UCLA Anderson</span>
          </motion.p>

          <motion.div variants={heroItem} className="flex items-center justify-center gap-3 pt-4 flex-wrap">
            <a
              href="https://github.com/TirthPatel3223"
              target="_blank"
              rel="noreferrer"
              className="p-3 text-neutral-400 hover:text-teal-400 hover:bg-neutral-800 rounded-full transition-all duration-200"
              aria-label="GitHub"
            >
              <Github className="w-5 h-5" />
            </a>
            <a
              href="https://www.linkedin.com/in/tirthpatel3223"
              target="_blank"
              rel="noreferrer"
              className="p-3 text-neutral-400 hover:text-teal-400 hover:bg-neutral-800 rounded-full transition-all duration-200"
              aria-label="LinkedIn"
            >
              <Linkedin className="w-5 h-5" />
            </a>
            <a
              href="mailto:tirthpatel3223@gmail.com"
              className="p-3 text-neutral-400 hover:text-teal-400 hover:bg-neutral-800 rounded-full transition-all duration-200"
              aria-label="Email"
            >
              <Mail className="w-5 h-5" />
            </a>
            <a
              href="/tirth_resume_enhanced.docx"
              target="_blank"
              className="inline-flex items-center gap-2 text-neutral-300 hover:text-teal-400 border border-neutral-700 hover:border-teal-500/50 rounded-full px-5 py-2.5 transition-all duration-200 text-sm font-medium hover:bg-teal-500/5"
            >
              <FileText className="w-4 h-4" />
              Resume
            </a>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-neutral-600 animate-bounce"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.div>
      </section>

      {/* ── ABOUT ────────────────────────────────────────────────────── */}
      <section id="about" className="max-w-4xl mx-auto px-4 py-32 border-t border-neutral-800/50">
        <motion.h2
          variants={sectionHeading}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-bold mb-12 text-center tracking-tight"
        >
          About Me
        </motion.h2>

        <div className="space-y-6 text-neutral-300 text-lg leading-relaxed">
          {[
            <>
              I grew up fascinated by how systems work — which led me to pursue a B.Tech in Engineering at{' '}
              <span className="text-teal-400 font-medium">IIT Madras</span>, one of India&apos;s premier technical
              institutions. There, I developed a deep foundation in mathematics, algorithms, and statistical thinking,
              which sparked my passion for turning raw data into meaningful insight.
            </>,
            <>
              After graduation, I joined <span className="text-teal-400 font-medium">Seat of Joy</span> as a Data
              Analyst, where I built end-to-end analytics pipelines and customer-facing dashboards. The startup
              environment pushed me to wear many hats — data engineering, ML modeling, and stakeholder communication —
              and taught me how to ship fast without sacrificing rigor.
            </>,
            <>
              I&apos;m now pursuing my{' '}
              <span className="text-teal-400 font-medium">
                Master of Science in Business Analytics (MSBA) at UCLA Anderson
              </span>
              , deepening my expertise in machine learning, optimization, and data strategy. I&apos;m driven by problems
              where data meets real-world impact — from NLP pipelines to deep reinforcement learning to
              production-grade recommendation systems.
            </>,
          ].map((content, i) => (
            <motion.p
              key={i}
              custom={i * 0.08}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {content}
            </motion.p>
          ))}
        </div>
      </section>

      {/* ── PROJECTS ─────────────────────────────────────────────────── */}
      <section id="projects" className="max-w-7xl mx-auto px-4 py-24 border-t border-neutral-800/50">
        <motion.div
          variants={sectionHeading}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center mb-16 space-y-3"
        >
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Projects</h2>
          <p className="text-neutral-400 max-w-xl mx-auto">
            A selection of data science and ML engineering work.
          </p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project, i) => (
            <ProjectCard key={project.id} project={project} index={i} />
          ))}
        </div>
      </section>

      {/* ── SKILLS ───────────────────────────────────────────────────── */}
      <section id="skills" className="max-w-5xl mx-auto px-4 py-24 border-t border-neutral-800/50">
        <motion.div
          variants={sectionHeading}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center mb-16 space-y-3"
        >
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Skills</h2>
          <p className="text-neutral-400">The tools and technologies I work with.</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(skills).map(([group, items], i) => (
            <motion.div
              key={group}
              custom={i * 0.07}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              whileHover={{ scale: 1.025, transition: { type: 'spring', stiffness: 350, damping: 22 } }}
              className="group bg-neutral-900/40 border border-neutral-800 rounded-2xl p-6 hover:border-teal-500/30 transition-colors duration-300 cursor-default"
            >
              <h3 className="text-xs font-bold uppercase tracking-widest text-teal-400 mb-4 group-hover:text-teal-300 transition-colors duration-200">
                {group}
              </h3>
              <div className="flex flex-wrap gap-2">
                {items.map((skill) => (
                  <span
                    key={skill}
                    className="text-sm bg-neutral-800 text-neutral-300 rounded-full px-3 py-1 group-hover:bg-neutral-700/70 transition-colors duration-200"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── EXPERIENCE ───────────────────────────────────────────────── */}
      <section id="experience" className="max-w-4xl mx-auto px-4 py-24 border-t border-neutral-800/50">
        <motion.div
          variants={sectionHeading}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Experience</h2>
        </motion.div>

        {/* Timeline */}
        <motion.div
          custom={0}
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="flex gap-6"
        >
          {/* Spine */}
          <div className="flex flex-col items-center">
            <div className="w-4 h-4 rounded-full bg-teal-500 border-4 border-neutral-950 shrink-0 mt-1.5" />
            <div className="w-px flex-1 bg-neutral-800 mt-2" />
          </div>

          {/* Card */}
          <div className="pb-12 flex-1">
            <motion.div
              whileHover={{ y: -4, transition: { type: 'spring', stiffness: 320, damping: 22 } }}
              className="group relative bg-neutral-900/40 border border-neutral-800 rounded-2xl p-6 hover:border-teal-500/30 transition-colors duration-300 overflow-hidden"
            >
              {/* Accent bar */}
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-teal-400 to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-t-2xl" />

              <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
                <div>
                  <h3 className="text-xl font-bold text-neutral-100">Data Analyst</h3>
                  <p className="text-teal-400 font-medium mt-0.5">Seat of Joy</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-sm text-neutral-400 bg-neutral-800 rounded-full px-3 py-1">
                    2022 – 2024
                  </span>
                  <p className="flex items-center gap-1 text-xs text-neutral-600 mt-2 justify-end">
                    <MapPin className="w-3 h-3" />
                    India
                  </p>
                </div>
              </div>

              <ul className="space-y-2.5 text-neutral-400 text-sm">
                {[
                  'Built end-to-end analytics pipelines processing 1M+ events daily using Python and SQL',
                  'Designed Tableau dashboards for executive stakeholders, improving data-driven decision velocity by 30%',
                  'Implemented customer segmentation models (k-means, RFM) that drove a 15% lift in retention campaigns',
                  'Defined KPIs and A/B testing frameworks with product and engineering teams',
                ].map((item, i) => (
                  <li key={i} className="flex gap-2 items-start">
                    <span className="text-teal-500 mt-0.5 shrink-0">▸</span>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ── CONTACT ──────────────────────────────────────────────────── */}
      <section id="contact" className="max-w-3xl mx-auto px-4 py-24 border-t border-neutral-800/50 text-center">
        <motion.div
          variants={sectionHeading}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Get In Touch</h2>
          <p className="text-neutral-400 text-lg mb-12 max-w-xl mx-auto">
            Whether you&apos;re recruiting, collaborating, or just want to talk data — my inbox is always open.
          </p>
        </motion.div>

        <motion.div
          custom={0.1}
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="flex flex-wrap items-center justify-center gap-4"
        >
          <a
            href="mailto:tirthpatel3223@gmail.com"
            className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-neutral-950 font-semibold rounded-full px-8 py-3.5 transition-all duration-200 hover:shadow-lg hover:shadow-teal-500/25 hover:-translate-y-0.5"
          >
            <Mail className="w-5 h-5" />
            Send Email
          </a>
          <a
            href="https://www.linkedin.com/in/tirthpatel3223"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 border border-neutral-700 hover:border-teal-500/50 text-neutral-300 hover:text-teal-400 font-medium rounded-full px-6 py-3.5 transition-all duration-200 hover:bg-teal-500/5 hover:-translate-y-0.5"
          >
            <Linkedin className="w-5 h-5" />
            LinkedIn
          </a>
          <a
            href="https://github.com/TirthPatel3223"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 border border-neutral-700 hover:border-teal-500/50 text-neutral-300 hover:text-teal-400 font-medium rounded-full px-6 py-3.5 transition-all duration-200 hover:bg-teal-500/5 hover:-translate-y-0.5"
          >
            <Github className="w-5 h-5" />
            GitHub
          </a>
          <a
            href="/tirth_resume_enhanced.docx"
            target="_blank"
            className="inline-flex items-center gap-2 border border-neutral-700 hover:border-teal-500/50 text-neutral-300 hover:text-teal-400 font-medium rounded-full px-6 py-3.5 transition-all duration-200 hover:bg-teal-500/5 hover:-translate-y-0.5"
          >
            <FileText className="w-5 h-5" />
            Resume
          </a>
        </motion.div>
      </section>

      {/* Footer */}
      <motion.footer
        custom={0}
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="border-t border-neutral-800/50 py-8 text-center text-neutral-600 text-sm"
      >
        <p>© {new Date().getFullYear()} Tirth Patel. Built with Next.js &amp; Tailwind CSS.</p>
      </motion.footer>

      {/* Floating AI Chat */}
      <Chat />
    </div>
  );
}
