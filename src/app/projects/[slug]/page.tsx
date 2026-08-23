import { getProjectBySlug, projects } from '@/data/projects';
import { ArrowLeft, Github, CheckCircle2, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import TableauPreviewCard from '@/components/TableauPreviewCard';
import CourseRAGPreviewCard from '@/components/CourseRAGPreviewCard';
import ScrollCubeWrapper from '@/components/ScrollCubeWrapper';
import Navbar from '@/components/Navbar';
import AnimatedBackground from '@/components/AnimatedBackground';
import WeatherParticles from '@/components/WeatherParticles';
import WeatherPipelineArchDiagram from '@/components/WeatherPipelineArchDiagram';
import WeatherPipelineInsights from '@/components/WeatherPipelineInsights';
import DeepCubeAPage from '@/components/DeepCubeAPage';
import MapblazerResultsChart from '@/components/MapblazerResultsChart';
import MapblazerArchDiagram from '@/components/MapblazerArchDiagram';
import MapblazerDashboardCard from '@/components/MapblazerDashboardCard';
import CrewPairingDemoCard from '@/components/CrewPairingDemoCard';
import CrewPairingResultsChart from '@/components/CrewPairingResultsChart';

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

  /* Retired slugs (the old covid / e-commerce pages) must answer 404, not a 200 with a
     "not found" body — a soft 404 keeps dead URLs in the search index. */
  if (!project) {
    notFound();
  }

  const { detail } = project;
  const isDataTech = slug === 'weather-dining-pipeline';
  const isCubeSolver = project.id === 'deep-cube-solver';
  const isRAG = project.id === 'course-rag-pipeline';
  const isMapblazer = project.id === 'mapblazer-wait-time-prediction';
  const isCrewPairing = project.id === 'airline-crew-pairing-rl';

  /* Accent colours per-project */
  const accentText   = isDataTech ? 'text-[#4e9bb9]'
    : isMapblazer ? 'mapblazer-accent-text'
    : isCrewPairing ? 'crewpair-accent-text'
    : isRAG ? 'site-accent-text'
    : 'cube-accent-text';
  const accentBorder = isDataTech ? 'border-[#1f77b4]/30'
    : isMapblazer ? 'mapblazer-accent-border'
    : isCrewPairing ? 'crewpair-accent-border'
    : isRAG ? 'site-accent-border'
    : 'cube-accent-border';
  const accentBg     = isDataTech ? 'bg-[#1f77b4]/10'
    : isMapblazer ? 'mapblazer-accent-bg'
    : isCrewPairing ? 'crewpair-accent-bg'
    : isRAG ? 'site-accent-bg'
    : 'cube-accent-bg';
  const accentHover  = isDataTech ? 'hover:border-[#4e9bb9]/50'
    : isMapblazer ? 'hover-mapblazer-accent-border'
    : isCrewPairing ? 'hover-crewpair-accent-border'
    : isRAG ? 'hover-site-accent-border'
    : 'hover:border-teal-500/40';

  const mainContent = (
    <main
      className={`min-h-screen selection:bg-teal-500/20${isCubeSolver ? ' cube-body-bg' : ''}${isMapblazer ? ' mapblazer-body-bg' : ''}${isCrewPairing ? ' crewpair-body-bg' : ''}`}
      style={{
        color: 'var(--foreground)',
        position: 'relative',
        zIndex: 10,
      }}
    >
      <Navbar />

      {/* ── HERO BANNER ─────────────────────────────────────────────── */}
      <div
        className={`relative overflow-hidden${isCubeSolver ? ' cube-hero-bg' : ''}${isMapblazer ? ' mapblazer-hero-bg' : ''}${isCrewPairing ? ' crewpair-hero-bg' : ''}`}
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        {/* Mapblazer hero background image (sits beneath the scrim gradients) */}
        {isMapblazer && project.hero_image && (
          <div
            className="absolute inset-0 pointer-events-none bg-cover bg-center opacity-25"
            style={{ backgroundImage: `url(${project.hero_image})` }}
          />
        )}

        {/* Project-specific gradient overlay (keeps original look) */}
        <div
          className={`absolute inset-0 pointer-events-none bg-gradient-to-br ${
            isDataTech
              ? 'from-[#0a192f]/90 via-transparent to-transparent'
              : isMapblazer
              ? 'mapblazer-dark-gradient from-[#100a02]/85 via-[#100a02]/40 to-transparent'
              : isCrewPairing
              ? 'crewpair-dark-gradient from-[#080918]/85 via-[#080918]/40 to-transparent'
              : isCubeSolver
              ? 'cube-dark-gradient from-teal-950/70 via-teal-950/30 to-transparent'
              : 'from-teal-950/40 via-transparent to-transparent'
          }`}
        />
        <div
          className={`absolute top-0 left-1/3 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none ${
            isDataTech ? 'bg-[#1f77b4]/12'
            : isMapblazer ? 'bg-[#f49611]/12'
            : isCrewPairing ? 'bg-[#6366f1]/14'
            : 'bg-teal-500/8'
          }`}
        />
        {isDataTech && <WeatherParticles />}

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
              <SectionLabel isDataTech={isDataTech} isMapblazer={isMapblazer} isCrewPairing={isCrewPairing}>Problem Statement</SectionLabel>
              <div className={`glass rounded-2xl p-8 border ${accentBorder}`}>
                <p className="leading-relaxed text-lg" style={{ color: 'var(--foreground)' }}>
                  {detail.problem_statement}
                </p>
              </div>
            </section>

            {/* Course RAG Live Demo — sits between Problem Statement and Results */}
            {isRAG && <CourseRAGPreviewCard />}

            {/* Results / Impact */}
            <section>
              <SectionLabel isDataTech={isDataTech} isMapblazer={isMapblazer} isCrewPairing={isCrewPairing}>Results &amp; Impact</SectionLabel>
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
                    {r.description && (
                      <p className="text-xs mt-1 leading-snug" style={{ color: 'var(--muted)', opacity: 0.7 }}>
                        {r.description}
                      </p>
                    )}
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

            {/* Dashboards — directly below Results & Impact */}
            {isDataTech && <TableauPreviewCard />}
            {isMapblazer && <MapblazerDashboardCard />}
            {isCrewPairing && <CrewPairingDemoCard />}

            {/* Mapblazer model comparison — reads against the dashboard above it */}
            {isMapblazer && <MapblazerResultsChart />}

            {/* Crew-pairing policy table — reads against the replay above it */}
            {isCrewPairing && <CrewPairingResultsChart />}

            {/* Approach / Methodology */}
            <section>
              <SectionLabel isDataTech={isDataTech} isMapblazer={isMapblazer} isCrewPairing={isCrewPairing}>Approach &amp; Methodology</SectionLabel>
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
              <SectionLabel isDataTech={isDataTech} isMapblazer={isMapblazer} isCrewPairing={isCrewPairing}>Architecture</SectionLabel>
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
                {isDataTech ? (
                  <WeatherPipelineArchDiagram />
                ) : isMapblazer ? (
                  <MapblazerArchDiagram />
                ) : (
                  <pre
                    className={`${isRAG ? 'site-accent-text' : isMapblazer ? 'mapblazer-accent-text' : isCrewPairing ? 'crewpair-accent-text' : 'text-teal-300/80'} text-xs md:text-sm font-mono leading-relaxed p-6 overflow-x-auto whitespace-pre`}
                    style={{ fontVariantLigatures: 'none', fontFeatureSettings: '"liga" 0, "calt" 0' }}
                  >
                    {detail.architecture}
                  </pre>
                )}
              </div>
            </section>

            {/* Weather Paradox Findings */}
            {isDataTech && <WeatherPipelineInsights />}
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
    return <ScrollCubeWrapper><DeepCubeAPage project={project} /></ScrollCubeWrapper>;
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
  isMapblazer,
  isCrewPairing,
}: {
  children: React.ReactNode;
  isDataTech?: boolean;
  isMapblazer?: boolean;
  isCrewPairing?: boolean;
}) {
  const hasGradient = isDataTech || isMapblazer || isCrewPairing;
  const gradientClass = isDataTech
    ? 'from-[#1f77b4] to-[#4e9bb9]'
    : isMapblazer
    ? 'from-[#f97316] to-[#fbbf24]'
    : isCrewPairing
    ? 'from-[#6366f1] to-[#a78bfa]'
    : '';

  return (
    <div className="flex items-center gap-3 mb-6">
      <h2
        className={`section-title text-2xl font-bold tracking-tight ${
          hasGradient
            ? `text-transparent bg-clip-text bg-gradient-to-r ${gradientClass}`
            : ''
        }`}
        style={
          isMapblazer || isCrewPairing
            ? { color: 'transparent' }
            : hasGradient
            ? undefined
            : { color: 'var(--title)' }
        }
      >
        {children}
      </h2>
      <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
    </div>
  );
}
