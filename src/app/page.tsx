'use client';

import { motion, type Variants } from 'framer-motion';
import Navbar from '@/components/Navbar';
import ProjectCard from '@/components/ProjectCard';
import AnimatedBackground from '@/components/AnimatedBackground';
import { projects } from '@/data/projects';
import { Github, Linkedin, Mail, FileText, MapPin } from 'lucide-react';

const skills: Record<string, string[]> = {
  /* Two things keep the grid from going ragged, and both matter if you edit this:
     group sizes are held to 7-13 items, and the ORDER is by rendered card weight
     (label length, not item count - "Champion/Challenger Promotion" costs a whole
     line) so each row of three holds cards of similar height. Every skill from the
     original eight groups is still here, just regrouped. */
  'Machine Learning': ['XGBoost', 'Prophet', 'scikit-learn', 'PyTorch', 'TensorFlow', 'Deep Learning', 'Deep RL', 'CUDA', 'Time-Series Forecasting', 'Feature Engineering', 'Transformers', 'Deep Q-Networks', 'Reward Design'],
  'MLOps & Productionization': ['Databricks', 'Databricks Asset Bundles', 'Automated Retraining', 'Champion/Challenger Promotion', 'Data Quality Gates', 'GitHub Actions', 'CI/CD', 'Docker', 'AWS EC2', 'TensorBoard', 'Experiment Tracking'],
  'Optimization & Operations Research': ['Gurobi', 'Linear Programming', 'Mixed-Integer Programming', 'Combinatorial Optimization', 'Constraint Modeling', 'Lazy Constraint Generation', 'Routing & Scheduling', 'Operations Research'],
  'Statistics & Causal Inference': ['Probability & Statistics', 'Regression', 'Causal Inference', 'Regression Discontinuity', 'Econometrics', 'Mathematical Modeling', 'Market Sizing Models'],
  'Languages & Tools': ['Python', 'SQL', 'R', 'JavaScript', 'TypeScript', 'Git', 'Jupyter', 'pytest', 'Next.js', 'Excel', 'systemd', 'Oracle Cloud', 'YAML-Driven Configuration'],
  'LLMs & Generative AI': ['LangGraph', 'Agentic RAG', 'ChromaDB', 'Vector Search', 'Claude & OpenAI APIs', 'Embeddings', 'Hugging Face', 'Prompt Engineering'],
  'Analytics & Visualization': ['Tableau', 'pandas', 'NumPy', 'Matplotlib', 'VADER NLP', 'Sentiment Analysis', 'KPI Design', 'Executive Dashboards', 'statsmodels', 'seaborn'],
  'Data Engineering': ['PySpark', 'Delta Lake', 'Snowflake', 'Airflow', 'Medallion Architecture', 'PostgreSQL', 'Supabase', 'FastAPI', 'Pydantic', 'ETL / ELT'],
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
    <div className="min-h-screen font-sans" style={{ color: 'var(--foreground)' }}>
      {/* Animated blob background */}
      <AnimatedBackground />

      {/* All content sits above the background */}
      <div className="relative z-10">
        <Navbar />

        {/* ── HERO ─────────────────────────────────────────────────────── */}
        <section
          id="hero"
          className="relative flex flex-col items-center justify-center min-h-screen px-4 pt-20 overflow-hidden"
        >
          <motion.div
            variants={heroContainer}
            initial="hidden"
            animate="visible"
            className="z-10 text-center space-y-6 max-w-4xl"
          >
            <motion.p
              variants={heroItem}
              className="text-sm font-semibold uppercase tracking-[0.2em]"
              style={{ color: 'var(--accent)' }}
            >
              Portfolio
            </motion.p>

            <motion.h1
              variants={heroItem}
              className="text-5xl sm:text-6xl md:text-8xl font-black tracking-tight bg-clip-text text-transparent"
              style={{
                backgroundImage: 'linear-gradient(135deg, var(--accent-hover), var(--accent), #1d4ed8)',
              }}
            >
              Tirth Patel
            </motion.h1>

            <motion.p
              variants={heroItem}
              className="text-base sm:text-xl md:text-2xl font-light max-w-2xl mx-auto leading-relaxed"
              style={{ color: 'var(--muted)' }}
            >
              Data Scientist &amp; ML Engineer
              <br />
              <span className="text-sm sm:text-lg opacity-75">MSBA @ UCLA Anderson</span>
            </motion.p>

            <motion.div
              variants={heroItem}
              className="flex items-center justify-center gap-3 pt-4 flex-wrap"
            >
              <a
                href="https://github.com/TirthPatel3223"
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-full transition-all duration-200 hover:scale-110"
                style={{ color: 'var(--muted)' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--accent)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--muted)'; }}
                aria-label="GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="https://www.linkedin.com/in/tirthpatel3223"
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-full transition-all duration-200 hover:scale-110"
                style={{ color: 'var(--muted)' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--accent)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--muted)'; }}
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="mailto:tirthpatel3223@gmail.com"
                className="p-3 rounded-full transition-all duration-200 hover:scale-110"
                style={{ color: 'var(--muted)' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--accent)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--muted)'; }}
                aria-label="Email"
              >
                <Mail className="w-5 h-5" />
              </a>
              <a
                href="/tirth_resume_main.pdf"
                target="_blank"
                className="inline-flex items-center gap-2 font-medium rounded-full px-5 py-2.5 transition-all duration-200 text-sm"
                style={{
                  color: 'var(--foreground)',
                  border: '1px solid var(--border)',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.color = 'var(--accent)';
                  el.style.borderColor = 'var(--accent)';
                  el.style.background = 'var(--accent-dim)';
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.color = 'var(--foreground)';
                  el.style.borderColor = 'var(--border)';
                  el.style.background = 'transparent';
                }}
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
            className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce"
            style={{ color: 'var(--border)' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </motion.div>
        </section>

        {/* ── ABOUT ────────────────────────────────────────────────────── */}
        <section
          id="about"
          className="max-w-4xl mx-auto px-4 py-32"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <motion.div
            variants={sectionHeading}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="section-title text-3xl md:text-4xl font-bold tracking-tight">
              About Me
            </h2>
          </motion.div>

          <div className="space-y-6 text-lg leading-relaxed" style={{ color: 'var(--foreground)' }}>
            {[
              <>
                I grew up fascinated by how systems work, which led me to pursue a B.Tech in Engineering at{' '}
                <span className="font-medium" style={{ color: 'var(--accent)' }}>IIT Madras</span>, one of India&apos;s
                premier technical institutions. There, I built a deep foundation in mathematics, statistics, and
                algorithms, and developed a taste for turning complex, messy data into decisions that actually matter.
              </>,
              <>
                During my undergrad, I joined{' '}
                <span className="font-medium" style={{ color: 'var(--accent)' }}>Seat of Joy</span>, a child safety
                startup incubated at IIT Madras, as a Business &amp; Strategy Analyst. I built a probabilistic
                market-sizing model from Indian Census data (100+ tables, 200K+ rows each) that estimated 55M target
                customers with 5% YoY growth, developed a supply-chain optimization model using operations research
                principles, led full competitor and pricing analysis across the category, and represented the startup
                at{' '}
                <span className="font-medium" style={{ color: 'var(--accent)' }}>Shark Tank India Auditions</span>,
                pitching data-backed market and business strategy to investors.
              </>,
              <>
                I&apos;m now pursuing my{' '}
                <span className="font-medium" style={{ color: 'var(--accent)' }}>
                  Master of Science in Business Analytics (MSBA) at UCLA Anderson
                </span>
                , deepening my expertise in machine learning, data engineering, and optimization. I&apos;m drawn to
                problems where rigorous analysis drives real-world impact, from production agentic RAG systems to
                large-scale data pipelines to deep reinforcement learning.
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

        {/* ── EXPERIENCE ───────────────────────────────────────────────── */}
        <section
          id="experience"
          className="max-w-4xl mx-auto px-4 py-24"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <motion.div
            variants={sectionHeading}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="section-title text-3xl md:text-4xl font-bold tracking-tight">
              Experience
            </h2>
          </motion.div>

          {/* Current role. No bullet list yet — the internship has only just started,
              so the card exists to place it on the timeline, nothing more. */}
          <motion.div
            custom={0}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="flex gap-6"
          >
            {/* Timeline spine */}
            <div className="flex flex-col items-center">
              <div
                className="w-4 h-4 rounded-full shrink-0 mt-1.5"
                style={{
                  background: 'var(--accent)',
                  border: '4px solid var(--background)',
                  boxShadow: '0 0 0 2px var(--accent-dim)',
                }}
              />
              <div className="w-px flex-1 mt-2" style={{ background: 'var(--border)' }} />
            </div>

            {/* Card */}
            <div className="pb-12 flex-1">
              <motion.div
                whileHover={{ y: -4, transition: { type: 'spring', stiffness: 320, damping: 22 } }}
                className="group relative glass rounded-2xl p-6 overflow-hidden"
                style={{ borderRadius: 'var(--radius-md)' }}
              >
                {/* Accent bar on hover */}
                <div
                  className="absolute inset-x-0 top-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-t-2xl"
                  style={{ background: 'linear-gradient(90deg, var(--accent), var(--accent-hover))' }}
                />

                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <h3 className="text-2xl font-bold" style={{ color: 'var(--title)' }}>
                      Data Science Intern
                    </h3>
                    <p className="font-medium mt-0.5" style={{ color: 'var(--accent)' }}>
                      Becton Dickinson
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className="inline-flex items-center gap-2 text-sm rounded-full px-3.5 py-1.5"
                      style={{ background: 'var(--accent-dim)', color: 'var(--foreground)' }}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ background: 'var(--accent)' }}
                      />
                      Aug 2026 – Current
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            custom={0.12}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="flex gap-6"
          >
            {/* Timeline spine */}
            <div className="flex flex-col items-center">
              <div
                className="w-4 h-4 rounded-full shrink-0 mt-1.5"
                style={{
                  background: 'var(--accent)',
                  border: '4px solid var(--background)',
                  boxShadow: '0 0 0 2px var(--accent-dim)',
                }}
              />
              <div className="w-px flex-1 mt-2" style={{ background: 'var(--border)' }} />
            </div>

            {/* Card */}
            <div className="pb-12 flex-1">
              <motion.div
                whileHover={{ y: -4, transition: { type: 'spring', stiffness: 320, damping: 22 } }}
                className="group relative glass rounded-2xl p-6 overflow-hidden"
                style={{ borderRadius: 'var(--radius-md)' }}
              >
                {/* Accent bar on hover */}
                <div
                  className="absolute inset-x-0 top-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-t-2xl"
                  style={{ background: 'linear-gradient(90deg, var(--accent), var(--accent-hover))' }}
                />

                <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
                  <div>
                    <h3 className="text-2xl font-bold" style={{ color: 'var(--title)' }}>
                      Business &amp; Strategy Analyst
                    </h3>
                    <p className="font-medium mt-0.5" style={{ color: 'var(--accent)' }}>
                      Seat of Joy{' '}
                      <span className="font-normal text-xs opacity-60">(Incubated at IIT Madras)</span>
                    </p>
                    <p className="text-sm mt-1.5 max-w-md leading-relaxed opacity-80" style={{ color: 'var(--foreground)' }}>
                      Child safety startup developing a full-body protective seat for two-wheelers, addressing the 2 children lost daily in India to two-wheeler accidents.
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className="text-sm rounded-full px-3.5 py-1.5"
                      style={{ background: 'var(--accent-dim)', color: 'var(--foreground)' }}
                    >
                      2022 – 2024
                    </span>
                    <p
                      className="flex items-center gap-1 text-sm mt-2 justify-end"
                      style={{ color: 'var(--muted)' }}
                    >
                      <MapPin className="w-3 h-3" />
                      India · During Undergrad
                    </p>
                  </div>
                </div>

                <ul className="space-y-6 text-base leading-relaxed" style={{ color: 'var(--muted)' }}>
                  {[
                    {
                      heading: 'Probabilistic Market-Sizing Model (Census Data)',
                      body: 'Sifted through 100+ Indian Census 2011 tables (200K+ rows each) to extract birth-order frequency matrices and inter-birth age-gap distributions. Built a joint-probability model that combined conditional age-gap probabilities with birth-order likelihoods to estimate, for any target year, how many Indian families have a child aged 3–6. Layered linear regression on historical cohorts to project YoY growth. Delivered an estimate of 55M addressable customers with 5% annual growth (45% more accurate than the startup\'s prior figures) and became the anchoring market-size number in every investor deck.',
                    },
                    {
                      heading: 'Supply-Chain Optimization Model (Operations Research)',
                      body: 'Formulated a profit-maximising distribution model in Gurobi / Excel Solver. The objective maximised margin across state-level shipping routes, accounting for manufacturing costs, per-unit shipping rates, and selling price. Added an elastic-net-style penalty to discourage over-concentration in any single state, and used the market-sizing model\'s state-level demand estimates as allocation caps. The model produces ready-to-execute distribution recommendations that can scale directly into production operations.',
                    },
                    {
                      heading: 'Competitive Intelligence & Pricing Strategy',
                      body: 'Conducted a full-stack competitive analysis across three child-safety product categories: built detailed SWOT profiles, cold-called manufacturers to source actual production costs, and computed competitor margins from first principles. Used margin benchmarking to derive a defensible pricing band, quantify competitive moat, and inform go-to-market sequencing. All findings fed directly into investor pitch materials and the product launch strategy.',
                    },
                    {
                      heading: 'Shark Tank India Auditions: Stakeholder Advisory & Investor Presentation',
                      body: 'Acted as the founding team\'s internal consultant, synthesising the market-sizing model, supply-chain analysis, competitive intelligence, and pricing strategy into a single client-ready narrative: total addressable market, competitive landscape, unit economics, and launch plan. Led a team of 3 through that synthesis, managed the founders\' alignment on the story pre-audition, then presented live to a panel of investor stakeholders and fielded adversarial, numbers-first Q&A with every claim traced back to an underlying model, a full consulting-style cycle of analysis, client alignment, and defended delivery.',
                    },
                  ].map(({ heading, body }, i) => (
                    <li key={i} className="flex gap-3 items-start">
                      <span className="mt-1 shrink-0 text-base leading-none" style={{ color: 'var(--accent)' }}>▸</span>
                      <div>
                        <span className="font-semibold block mb-1.5 text-[1.05rem]" style={{ color: 'var(--foreground)' }}>
                          {heading}
                        </span>
                        {body}
                      </div>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* ── PROJECTS ─────────────────────────────────────────────────── */}
        <section
          id="projects"
          className="max-w-7xl mx-auto px-4 py-24"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <motion.div
            variants={sectionHeading}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16 space-y-3"
          >
            <h2 className="section-title text-3xl md:text-4xl font-bold tracking-tight">
              Projects
            </h2>
            <p className="mt-6 max-w-xl mx-auto" style={{ color: 'var(--muted)' }}>
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
        <section
          id="skills"
          className="max-w-5xl mx-auto px-4 py-24"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <motion.div
            variants={sectionHeading}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16 space-y-3"
          >
            <h2 className="section-title text-3xl md:text-4xl font-bold tracking-tight">
              Skills
            </h2>
            <p className="mt-6" style={{ color: 'var(--muted)' }}>
              The tools and technologies I work with.
            </p>
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
                whileHover={{ y: -6, transition: { type: 'spring', stiffness: 350, damping: 22 } }}
                className="group glass rounded-2xl p-6 cursor-default"
                style={{ borderRadius: 'var(--radius-md)' }}
              >
                <h3
                  className="text-xs font-bold uppercase tracking-widest mb-4 transition-colors duration-200"
                  style={{ color: 'var(--accent)' }}
                >
                  {group}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {items.map((skill) => (
                    <span
                      key={skill}
                      className="text-sm rounded-full px-3 py-1 transition-colors duration-200"
                      style={{
                        background: 'var(--accent-dim)',
                        color: 'var(--foreground)',
                        border: '1px solid var(--accent-dim-hover)',
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── CONTACT ──────────────────────────────────────────────────── */}
        <section
          id="contact"
          className="max-w-3xl mx-auto px-4 py-24 text-center"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <motion.div
            variants={sectionHeading}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <h2 className="section-title text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Get In Touch
            </h2>
            <p className="text-lg mb-12 max-w-xl mx-auto mt-6" style={{ color: 'var(--muted)' }}>
              Whether you&apos;re recruiting, collaborating, or just want to talk data, my inbox is always open.
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
              className="inline-flex items-center gap-2 font-semibold rounded-full px-8 py-3.5 transition-all duration-200 hover:-translate-y-0.5 text-white"
              style={{ background: 'var(--accent)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--accent-hover)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--accent)'; }}
            >
              <Mail className="w-5 h-5" />
              Send Email
            </a>
            {[
              { href: 'https://www.linkedin.com/in/tirthpatel3223', icon: <Linkedin className="w-5 h-5" />, label: 'LinkedIn' },
              { href: 'https://github.com/TirthPatel3223', icon: <Github className="w-5 h-5" />, label: 'GitHub' },
              { href: '/tirth_resume_main.pdf', icon: <FileText className="w-5 h-5" />, label: 'Resume' },
            ].map(({ href, icon, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 font-medium rounded-full px-6 py-3.5 transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  border: '1px solid var(--border)',
                  color: 'var(--foreground)',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.color = 'var(--accent)';
                  el.style.borderColor = 'var(--accent)';
                  el.style.background = 'var(--accent-dim)';
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.color = 'var(--foreground)';
                  el.style.borderColor = 'var(--border)';
                  el.style.background = 'transparent';
                }}
              >
                {icon}
                {label}
              </a>
            ))}
          </motion.div>
        </section>

        {/* Footer */}
        <motion.footer
          custom={0}
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="py-8 text-center text-sm"
          style={{
            borderTop: '1px solid var(--border)',
            color: 'var(--muted)',
          }}
        >
          <p>© {new Date().getFullYear()} Tirth Patel. Built with Next.js &amp; Tailwind CSS.</p>
        </motion.footer>
      </div>
    </div>
  );
}
