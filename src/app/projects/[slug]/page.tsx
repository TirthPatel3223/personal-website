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
import MapblazerDashboardCard from '@/components/MapblazerDashboardCard';
import CrewPairingDemoCard from '@/components/CrewPairingDemoCard';
import CrewPairingResultsChart from '@/components/CrewPairingResultsChart';
import AirbnbRDDResults from '@/components/AirbnbRDDResults';
import AirbnbFindingCallout from '@/components/AirbnbFindingCallout';
import RouteOptItineraryCard from '@/components/RouteOptItineraryCard';

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
     "not found" body: a soft 404 keeps dead URLs in the search index. */
  if (!project) {
    notFound();
  }

  const { detail } = project;
  const isDataTech = slug === 'weather-dining-pipeline';
  const isCubeSolver = project.id === 'deep-cube-solver';
  const isRAG = project.id === 'course-rag-pipeline';
  const isMapblazer = project.id === 'mapblazer-wait-time-prediction';
  const isCrewPairing = project.id === 'airline-crew-pairing-rl';
  const isAirbnb = project.id === 'airbnb-superhost-rdd';
  const isRouteOpt = project.id === 'mapblazer-route-optimization';

  /* Accent colours per-project */
  const accentText   = isDataTech ? 'text-[#4e9bb9]'
    : isMapblazer ? 'mapblazer-accent-text'
    : isRouteOpt ? 'routeopt-accent-text'
    : isCrewPairing ? 'crewpair-accent-text'
    : isAirbnb ? 'airbnb-accent-text'
    : isRAG ? 'site-accent-text'
    : 'cube-accent-text';
  const accentBorder = isDataTech ? 'border-[#1f77b4]/30'
    : isMapblazer ? 'mapblazer-accent-border'
    : isRouteOpt ? 'routeopt-accent-border'
    : isCrewPairing ? 'crewpair-accent-border'
    : isAirbnb ? 'airbnb-accent-border'
    : isRAG ? 'site-accent-border'
    : 'cube-accent-border';
  const accentBg     = isDataTech ? 'bg-[#1f77b4]/10'
    : isMapblazer ? 'mapblazer-accent-bg'
    : isRouteOpt ? 'routeopt-accent-bg'
    : isCrewPairing ? 'crewpair-accent-bg'
    : isAirbnb ? 'airbnb-accent-bg'
    : isRAG ? 'site-accent-bg'
    : 'cube-accent-bg';
  const accentHover  = isDataTech ? 'hover:border-[#4e9bb9]/50'
    : isMapblazer ? 'hover-mapblazer-accent-border'
    : isRouteOpt ? 'hover-routeopt-accent-border'
    : isCrewPairing ? 'hover-crewpair-accent-border'
    : isAirbnb ? 'hover-airbnb-accent-border'
    : isRAG ? 'hover-site-accent-border'
    : 'hover:border-teal-500/40';

  /* Every project page runs the homepage theme: each glass panel gets the same
     lift + accent bar + top-left glow the homepage cards have on hover. The bar and
     glow colours come from the page's own --fx-* vars (globals.css), so the pages
     keep their individual accents. */
  const cardFx = ' home-card';

  const mainContent = (
    <main
      className={`min-h-screen${isCubeSolver ? ' cube-body-bg' : ''}${isDataTech ? ' datatech-body-bg' : ''}${isMapblazer ? ' mapblazer-body-bg' : ''}${isRouteOpt ? ' routeopt-body-bg' : ''}${isCrewPairing ? ' crewpair-body-bg' : ''}${isAirbnb ? ' airbnb-body-bg' : ''}`}
      style={{
        color: 'var(--foreground)',
        position: 'relative',
        zIndex: 10,
      }}
    >
      <Navbar />

      {/* ── HERO BANNER ─────────────────────────────────────────────── */}
      <div
        className={`relative overflow-hidden${isCubeSolver ? ' cube-hero-bg' : ''}${isMapblazer ? ' mapblazer-hero-bg' : ''}${isRouteOpt ? ' routeopt-hero-bg' : ''}${isCrewPairing ? ' crewpair-hero-bg' : ''}${isAirbnb ? ' airbnb-hero-bg' : ''}`}
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        {/* Mapblazer hero background image (sits beneath the scrim gradients) */}
        {isMapblazer && project.hero_image && (
          <div
            className="absolute inset-0 pointer-events-none bg-cover bg-center opacity-25"
            style={{ backgroundImage: `url(${project.hero_image})` }}
          />
        )}

        {/* No scrim gradient over the hero: the animated blob background is the
            backdrop here exactly as it is on the homepage. Only the accent glow
            below stays, which is the per-project equivalent of the homepage's own
            radial accent washes. */}
        <div
          className={`absolute top-0 left-1/3 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none ${
            isDataTech ? 'bg-[#1f77b4]/12'
            : isMapblazer ? 'bg-[#f49611]/12'
            : isRouteOpt ? 'bg-[#60a5fa]/12'
            : isCrewPairing ? 'bg-[#60a5fa]/12'
            : isAirbnb ? 'bg-[#FF385C]/14'
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
            className={`text-4xl md:text-6xl font-black tracking-tight mb-5 max-w-3xl leading-tight${
              isRouteOpt || isCrewPairing ? ' bg-clip-text' : ''
            }`}
            /* Homepage-theme pages reuse the hero wordmark gradient from page.tsx. */
            style={
              isRouteOpt || isCrewPairing
                ? {
                    color: 'transparent',
                    backgroundImage:
                      'linear-gradient(135deg, var(--accent-hover), var(--accent), #1d4ed8)',
                  }
                : { color: 'var(--title)' }
            }
          >
            {project.title}
          </h1>

          <p className="text-lg md:text-xl font-light max-w-2xl leading-relaxed mb-8" style={{ color: 'var(--muted)' }}>
            {project.short_description}
          </p>

          {/* Tech tags: project-specific colours kept */}
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
              <SectionLabel isDataTech={isDataTech} isMapblazer={isMapblazer} isAirbnb={isAirbnb}>Problem Statement</SectionLabel>
              <div className={`glass rounded-2xl p-8 border ${accentBorder}${cardFx}`}>
                <p className="leading-relaxed text-lg" style={{ color: 'var(--foreground)' }}>
                  {detail.problem_statement}
                </p>
              </div>
            </section>

            {/* Course RAG Live Demo: sits between Problem Statement and Results */}
            {isRAG && <CourseRAGPreviewCard />}

            {/* Results / Impact */}
            <section>
              <SectionLabel isDataTech={isDataTech} isMapblazer={isMapblazer} isAirbnb={isAirbnb}>Results &amp; Impact</SectionLabel>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
                {detail.results.map((r, i) => (
                  <div
                    key={i}
                    className={`glass border ${accentBorder} ${accentHover} rounded-2xl p-5 transition-colors text-center${cardFx}`}
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

              {/* Airbnb: the headline finding, spelled out under the metric grid */}
              {isAirbnb && <AirbnbFindingCallout />}

              <div className={`glass border ${accentBorder} rounded-2xl p-6 space-y-3${cardFx}`}>
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

            {/* Dashboards: directly below Results & Impact */}
            {isDataTech && <TableauPreviewCard />}
            {isMapblazer && <MapblazerDashboardCard />}
            {isCrewPairing && <CrewPairingDemoCard />}
            {isRouteOpt && <RouteOptItineraryCard />}

            {/* Mapblazer model comparison: reads against the dashboard above it */}
            {isMapblazer && <MapblazerResultsChart />}

            {/* Crew-pairing policy table: reads against the replay above it */}
            {isCrewPairing && <CrewPairingResultsChart />}

            {/* Airbnb RDD plots + coefficient table: the evidence behind the finding */}
            {isAirbnb && <AirbnbRDDResults />}

            {/* Approach / Methodology */}
            <section>
              <SectionLabel isDataTech={isDataTech} isMapblazer={isMapblazer} isAirbnb={isAirbnb}>Approach &amp; Methodology</SectionLabel>
              <div className="space-y-4">
                {detail.approach.map((item, i) => (
                  <div
                    key={i}
                    className={`flex gap-5 glass border ${accentBorder} ${accentHover} rounded-2xl p-6 transition-colors${cardFx}`}
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
              <SectionLabel isDataTech={isDataTech} isMapblazer={isMapblazer} isAirbnb={isAirbnb}>Architecture</SectionLabel>
              <div className={`glass border ${accentBorder} rounded-2xl overflow-hidden${cardFx}`}>
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
                ) : (
                  <pre
                    className={`${isRAG ? 'site-accent-text' : isMapblazer ? 'mapblazer-accent-text' : isRouteOpt ? 'routeopt-accent-text' : isCrewPairing ? 'crewpair-accent-text' : isAirbnb ? 'airbnb-accent-text' : 'text-teal-300/80'} text-xs md:text-sm font-mono leading-relaxed p-6 overflow-x-auto whitespace-pre`}
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
              <section className={`glass p-8 rounded-3xl border ${accentBorder}${cardFx}`}>
                <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--title)' }}>
                  Motivation
                </h2>
                <p className="leading-relaxed text-lg" style={{ color: 'var(--foreground)' }}>
                  {project.motivation}
                </p>
              </section>
              <section className={`glass p-8 rounded-3xl border ${accentBorder}${cardFx}`}>
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
              <section className={`glass p-8 rounded-3xl border ${accentBorder}${cardFx}`}>
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

/* No isRouteOpt / isCrewPairing flags here on purpose: those two pages run the
   homepage heading treatment (solid --title text with the accent gradient
   underline from .section-title) rather than a per-project gradient fill. */
function SectionLabel({
  children,
  isDataTech,
  isMapblazer,
  isAirbnb,
}: {
  children: React.ReactNode;
  isDataTech?: boolean;
  isMapblazer?: boolean;
  isAirbnb?: boolean;
}) {
  const hasGradient = isDataTech || isMapblazer || isAirbnb;
  const gradientClass = isDataTech
    ? 'from-[#1f77b4] to-[#4e9bb9]'
    : isMapblazer
    ? 'from-[#f97316] to-[#fbbf24]'
    : isAirbnb
    ? 'from-[#a10d33] to-[#d1214e] dark:from-[#FF385C] dark:to-[#FF9A8B]'
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
          isMapblazer || isAirbnb
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
