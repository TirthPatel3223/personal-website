import { getProjectBySlug, projects } from '@/data/projects';
import { ArrowLeft, Github, CheckCircle2, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import TableauPreviewCard from '@/components/TableauPreviewCard';
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
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Project Not Found</h1>
          <Link href="/" className="text-teal-400 hover:underline">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  const { detail } = project;
  const isDataTech = slug === 'weather-dining-pipeline';

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-50 selection:bg-teal-500/30">

      {/* ── HERO BANNER ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden border-b border-neutral-800">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-950/60 via-neutral-950 to-neutral-950 pointer-events-none" />
        <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-teal-500/8 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 pt-10 pb-16">
          {/* Back link */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-neutral-500 hover:text-teal-400 transition-colors text-sm mb-10 group"
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

          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-5 max-w-3xl leading-tight">
            {project.title}
          </h1>

          <p className="text-lg md:text-xl text-neutral-400 font-light max-w-2xl leading-relaxed mb-8">
            {project.short_description}
          </p>

          {/* Tech tags */}
          <div className="flex flex-wrap gap-2 mb-8">
            {project.tech_stack.map((tech) => (
              <span
                key={tech}
                className="text-sm bg-teal-500/10 text-teal-300 border border-teal-500/25 rounded-full px-4 py-1.5 font-medium"
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
              className="inline-flex items-center gap-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white font-medium rounded-full px-6 py-3 transition-all border border-neutral-700 hover:border-neutral-600"
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
              <div className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-8">
                <p className="text-neutral-300 leading-relaxed text-lg">{detail.problem_statement}</p>
              </div>
            </section>

            {/* Approach / Methodology */}
            <section>
              <SectionLabel isDataTech={isDataTech}>Approach & Methodology</SectionLabel>
              <div className="space-y-4">
                {detail.approach.map((item, i) => (
                  <div
                    key={i}
                    className="flex gap-5 bg-neutral-900/30 border border-neutral-800 rounded-2xl p-6 hover:border-teal-500/30 transition-colors"
                  >
                    <div className={`shrink-0 w-8 h-8 rounded-full ${isDataTech ? 'bg-[#1f77b4]/10 text-[#4e9bb9] border border-[#1f77b4]/30' : 'bg-teal-500/10 border border-teal-500/30 text-teal-400'} flex items-center justify-center font-bold text-sm mt-0.5`}>
                      {i + 1}
                    </div>
                    <div>
                      <h3 className="text-neutral-100 font-semibold mb-1.5 flex items-center gap-2">
                        <ChevronRight className="w-4 h-4 text-teal-500" />
                        {item.step}
                      </h3>
                      <p className="text-neutral-400 text-sm leading-relaxed">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Architecture Diagram */}
            <section>
              <SectionLabel isDataTech={isDataTech}>Architecture</SectionLabel>
              <div className={`${isDataTech ? 'bg-[#0a192f] border-[#1f77b4]/30' : 'bg-neutral-900/60 border-neutral-800'} border rounded-2xl overflow-hidden`}>
                <div className="flex items-center gap-2 px-5 py-3 border-b border-neutral-800 bg-neutral-900/80">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-500/60" />
                    <span className="w-3 h-3 rounded-full bg-amber-500/60" />
                    <span className="w-3 h-3 rounded-full bg-green-500/60" />
                  </div>
                  <span className="text-xs text-neutral-500 ml-2 font-mono">architecture-diagram</span>
                </div>
                <pre className={`${isDataTech ? 'text-[#92c5de]' : 'text-teal-300/80'} text-xs md:text-sm font-mono leading-relaxed p-6 overflow-x-auto whitespace-pre`}>
                  {detail.architecture}
                </pre>
              </div>
            </section>

            {/* Results / Impact */}
            <section>
              <SectionLabel isDataTech={isDataTech}>Results & Impact</SectionLabel>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
                {detail.results.map((r, i) => (
                  <div
                    key={i}
                    className={`${isDataTech ? 'bg-[#0a192f] border-[#1f77b4]/30 hover:border-[#4e9bb9]/50' : 'bg-neutral-900/40 border-neutral-800 hover:border-teal-500/30'} border rounded-2xl p-5 transition-colors text-center`}
                  >
                    <p className={`text-2xl md:text-3xl font-black ${isDataTech ? 'text-[#4e9bb9]' : 'text-teal-400'} mb-1`}>{r.value}</p>
                    <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">{r.metric}</p>
                  </div>
                ))}
              </div>

              {/* Key achievements from data */}
              <div className="bg-neutral-900/30 border border-neutral-800 rounded-2xl p-6 space-y-3">
                {project.achievements.map((ach, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />
                    <span className="text-neutral-300 text-sm leading-relaxed">{ach}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Tableau Dashboard Preview Section */}
            {isDataTech && <TableauPreviewCard />}
          </>
        ) : (
          /* Fallback for projects without rich detail */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="col-span-1 md:col-span-2 space-y-8">
              <section className="bg-neutral-900/30 p-8 rounded-3xl border border-neutral-800">
                <h2 className="text-2xl font-bold text-white mb-4">Motivation</h2>
                <p className="text-neutral-300 leading-relaxed text-lg">{project.motivation}</p>
              </section>
              <section className="bg-neutral-900/30 p-8 rounded-3xl border border-neutral-800">
                <h2 className="text-2xl font-bold text-white mb-4">Key Achievements</h2>
                <ul className="space-y-4 text-neutral-300">
                  {project.achievements.map((ach, i) => (
                    <li key={i} className="flex gap-4 items-start">
                      <span className="w-6 h-6 rounded-full bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0 mt-0.5 text-sm font-bold">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{ach}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
            <div className="col-span-1">
              <section className="bg-teal-900/10 p-8 rounded-3xl border border-teal-500/20">
                <h3 className="text-xs font-bold text-white mb-4 tracking-widest uppercase">Tech Stack</h3>
                <div className="flex flex-wrap gap-2">
                  {project.tech_stack.map((tech) => (
                    <span
                      key={tech}
                      className="text-sm bg-teal-500/10 text-teal-300 border border-teal-500/20 rounded-full px-3 py-1"
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
        <div className="flex items-center justify-between pt-8 border-t border-neutral-800">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-neutral-400 hover:text-teal-400 transition-colors text-sm group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Projects
          </Link>
          {detail?.github_url && (
            <a
              href={detail.github_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-neutral-400 hover:text-teal-400 transition-colors text-sm"
            >
              <Github className="w-4 h-4" />
              GitHub
            </a>
          )}
        </div>
      </div>
    </main>
  );
}

function SectionLabel({ children, isDataTech }: { children: React.ReactNode, isDataTech?: boolean }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <h2 className={`text-2xl font-bold tracking-tight ${isDataTech ? 'text-transparent bg-clip-text bg-gradient-to-r from-[#1f77b4] to-[#4e9bb9]' : 'text-white'}`}>{children}</h2>
      <div className="flex-1 h-px bg-neutral-800" />
    </div>
  );
}
