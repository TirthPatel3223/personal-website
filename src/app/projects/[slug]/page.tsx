import { getProjectBySlug, projects } from '@/data/projects';
import { ArrowLeft, Github, CheckCircle2, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import TableauPreviewCard from '@/components/TableauPreviewCard';
import ScrollCubeWrapper from '@/components/ScrollCubeWrapper';
import Navbar from '@/components/Navbar';
import AnimatedBackground from '@/components/AnimatedBackground';

export async function generateStaticParams() {
  return projects.map((project) => ({ slug: project.id }));
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Project Not Found</h1>
          <Link href="/" style={{ color: 'var(--accent)' }} className="hover:underline">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  const { detail } = project;
  const isDataTech = slug === 'weather-dining-pipeline';
  const isCubeSolver = project.id === 'deep-cube-solver';

  /* Accent colours stay per-project (unchanged from original) */
  const accentText   = isDataTech ? 'text-[#4e9bb9]'         : 'text-teal-400';
  const accentBorder = isDataTech ? 'border-[#1f77b4]/30'     : 'border-teal-500/30';
  const accentBg     = isDataTech ? 'bg-[#1f77b4]/10'         : 'bg-teal-500/10';
  const accentHover  = isDataTech ? 'hover:border-[#4e9bb9]/50' : 'hover:border-teal-500/40';

  const mainContent = (
    <main
      className="min-h-screen selection:bg-teal-500/20"
      style={{
        color: 'var(--foreground)',
        position: 'relative',
        zIndex: 10,
        /* For the cube solver page, give every section a dark scrim so text
           stays legible against the 3D Rubik's cube in the background */
        backgroundColor: isCubeSolver ? 'rgba(5, 8, 16, 0.55)' : undefined,
      }}
    >
      <Navbar />

      {/* ── HERO BANNER ─────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={{
          borderBottom: '1px solid var(--border)',
          /* Solid backing for the cube solver so the 3D background doesn't bleed through */
          backgroundColor: isCubeSolver ? 'rgba(5, 8, 16, 0.82)' : undefined,
        }}
      >
        {/* Project-specific gradient overlay (keeps original look) */}
        <div
          className={`absolute inset-0 pointer-events-none bg-gradient-to-br ${
            isDataTech
              ? 'from-[#0a192f]/90 via-transparent to-transparent'
              : isCubeSolver
              ? 'from-teal-950/70 via-teal-950/30 to-transparent'
              : 'from-teal-950/40 via-transparent to-transparent'
          }`}
        />
        <div
          className={`absolute top-0 left-1/3 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none ${
            isDataTech ? 'bg-[#1f77b4]/12' : 'bg-teal-500/8'
          }`}
        />

        <div className="relative max-w-5xl mx-auto px-4 pt-28 pb-16">
          {/* Back link */}
          <Link
            href="/"
            className={`inline-flex items-center gap-2 transition-colors text-sm mb-10 group ${accentText}`}
            style={{ color: 'var(--muted)' }}
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Projects
          </Link>

          {/* Status badge */}
          {project.status === 'coming-soon' && (
            <span className="inline-block mb-4 text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full px-3 py-1">
              Coming Soon
            </span>
          )}

          <h1
            className="text-4xl md:text-6xl font-black tracking-tight mb-5 max-w-3xl leading-tight"
            style={{ color: 'var(--title)' }}
          >
            {project.title}
          </h1>

          <p className="text-lg md:text-xl font-light max-w-2xl leading-relaxed mb-8" style={{ color: 'var(--muted)' }}>
            {project.short_description}
          </p>

          {/* Tech tags — project-specific colours kept */}
          <div className="flex flex-wrap gap-2 mb-8">
            {project.tech_stack.map((tech) => (
              <span
                key={tech}
                className={`text-sm rounded-full px-4 py-1.5 font-medium border ${accentBg} ${accentText} ${accentBorder}`}
              >
                {tech}
              </span>
            ))}
          </div>

          {/* GitHub button */}
          {detail?.github_url && (
            <a
              href={detail.github_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2.5 glass font-medium rounded-full px-6 py-3 transition-all"
              style={{ color: 'var(--foreground)' }}
            >
              <Github className="w-5 h-5" />
              View on GitHub
            </a>
          )}
        </div>
      </div>

      {/* ── CONTENT ─────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 py-16 space-y-16">

        {detail ? (
          <>
            {/* Problem Statement */}
            <section>
              <SectionLabel isDataTech={isDataTech}>Problem Statement</SectionLabel>
              <div className={`glass rounded-2xl p-8 border ${accentBorder}`}>
                <p className="leading-relaxed text-lg" style={{ color: 'var(--foreground)' }}>
                  {detail.problem_statement}
                </p>
              </div>
            </section>

            {/* Approach / Methodology */}
            <section>
              <SectionLabel isDataTech={isDataTech}>Approach &amp; Methodology</SectionLabel>
              <div className="space-y-4">
                {detail.approach.map((item, i) => (
                  <div
                    key={i}
                    className={`flex gap-5 glass border ${accentBorder} ${accentHover} rounded-2xl p-6 transition-colors`}
                  >
                    <div
                      className={`shrink-0 w-8 h-8 rounded-full ${accentBg} ${accentText} border ${accentBorder} flex items-center justify-center font-bold text-sm mt-0.5`}
                    >
                      {i + 1}
                    </div>
                    <div>
                      <h3
                        className="font-semibold mb-1.5 flex items-center gap-2"
                        style={{ color: 'var(--title)' }}
                      >
                        <ChevronRight className={`w-4 h-4 ${accentText}`} />
                        {item.step}
                      </h3>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
                        {item.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Architecture Diagram */}
            <section>
              <SectionLabel isDataTech={isDataTech}>Architecture</SectionLabel>
              <div className={`glass border ${accentBorder} rounded-2xl overflow-hidden`}>
                <div
                  className="flex items-center gap-2 px-5 py-3"
                  style={{ borderBottom: '1px solid var(--border)' }}
                >
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-500/60" />
                    <span className="w-3 h-3 rounded-full bg-amber-500/60" />
                    <span className="w-3 h-3 rounded-full bg-green-500/60" />
                  </div>
                  <span className="text-xs font-mono ml-2" style={{ color: 'var(--muted)' }}>
                    architecture-diagram
                  </span>
                </div>
                <pre
                  className={`${isDataTech ? 'text-[#92c5de]' : 'text-teal-300/80'} text-xs md:text-sm font-mono leading-relaxed p-6 overflow-x-auto whitespace-pre`}
                >
                  {detail.architecture}
                </pre>
              </div>
            </section>

            {/* Results / Impact */}
            <section>
              <SectionLabel isDataTech={isDataTech}>Results &amp; Impact</SectionLabel>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
                {detail.results.map((r, i) => (
                  <div
                    key={i}
                    className={`glass border ${accentBorder} ${accentHover} rounded-2xl p-5 transition-colors text-center`}
                  >
                    <p className={`text-2xl md:text-3xl font-black ${accentText} mb-1`}>{r.value}</p>
                    <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--muted)' }}>
                      {r.metric}
                    </p>
                  </div>
                ))}
              </div>

              <div className={`glass border ${accentBorder} rounded-2xl p-6 space-y-3`}>
                {project.achievements.map((ach, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className={`w-5 h-5 ${accentText} shrink-0 mt-0.5`} />
                    <span className="text-sm leading-relaxed" style={{ color: 'var(--foreground)' }}>
                      {ach}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Tableau Dashboard Preview */}
            {isDataTech && <TableauPreviewCard />}
          </>
        ) : (
          /* Fallback for projects without rich detail */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="col-span-1 md:col-span-2 space-y-8">
              <section className={`glass p-8 rounded-3xl border ${accentBorder}`}>
                <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--title)' }}>
                  Motivation
                </h2>
                <p className="leading-relaxed text-lg" style={{ color: 'var(--foreground)' }}>
                  {project.motivation}
                </p>
              </section>
              <section className={`glass p-8 rounded-3xl border ${accentBorder}`}>
                <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--title)' }}>
                  Key Achievements
                </h2>
                <ul className="space-y-4" style={{ color: 'var(--foreground)' }}>
                  {project.achievements.map((ach, i) => (
                    <li key={i} className="flex gap-4 items-start">
                      <span
                        className={`w-6 h-6 rounded-full ${accentBg} ${accentText} flex items-center justify-center shrink-0 mt-0.5 text-sm font-bold`}
                      >
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{ach}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
            <div className="col-span-1">
              <section className={`glass p-8 rounded-3xl border ${accentBorder}`}>
                <h3 className="text-xs font-bold mb-4 tracking-widest uppercase" style={{ color: 'var(--title)' }}>
                  Tech Stack
                </h3>
                <div className="flex flex-wrap gap-2">
                  {project.tech_stack.map((tech) => (
                    <span
                      key={tech}
                      className={`text-sm ${accentBg} ${accentText} border ${accentBorder} rounded-full px-3 py-1`}
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}

        {/* Bottom nav */}
        <div
          className="flex items-center justify-between pt-8"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <Link
            href="/"
            className={`inline-flex items-center gap-2 transition-colors text-sm group ${accentText}`}
            style={{ color: 'var(--muted)' }}
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Projects
          </Link>
          {detail?.github_url && (
            <a
              href={detail.github_url}
              target="_blank"
              rel="noreferrer"
              className={`inline-flex items-center gap-2 transition-colors text-sm ${accentText}`}
            >
              <Github className="w-4 h-4" />
              GitHub
            </a>
          )}
        </div>
      </div>
    </main>
  );

  if (isCubeSolver) {
    /* Cube page: Rubik's cube stays as background, no animated blobs */
    return <ScrollCubeWrapper>{mainContent}</ScrollCubeWrapper>;
  }

  /* All other project pages: use the animated blob background */
  return (
    <div>
      <AnimatedBackground />
      <div style={{ position: 'relative', zIndex: 10 }}>
        {mainContent}
      </div>
    </div>
  );
}

function SectionLabel({
  children,
  isDataTech,
}: {
  children: React.ReactNode;
  isDataTech?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <h2
        className={`section-title text-2xl font-bold tracking-tight ${
          isDataTech
            ? 'text-transparent bg-clip-text bg-gradient-to-r from-[#1f77b4] to-[#4e9bb9]'
            : ''
        }`}
        style={isDataTech ? undefined : { color: 'var(--title)' }}
      >
        {children}
      </h2>
      <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
    </div>
  );
}
