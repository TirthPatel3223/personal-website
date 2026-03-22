"use client";

import { motion, Variants } from "framer-motion";
import { BarChart2, ExternalLink } from "lucide-react";
import Image from "next/image";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

export default function TableauPreviewCard() {
  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#1f77b4] to-[#4e9bb9]">
          Tableau Dashboard Preview
        </h2>
        <div className="flex-1 h-px bg-neutral-800" />
      </div>

      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="w-full bg-[#0a192f] border border-[#1f77b4]/40 rounded-2xl p-6 md:p-8 hover:shadow-[0_0_35px_rgba(31,119,180,0.15)] transition-shadow duration-300"
      >
        <div className="flex flex-col gap-8">
          {/* Screenshot Image */}
          <div className="relative w-full rounded-xl overflow-hidden border border-[#4e9bb9]/30 group shadow-2xl">
            <Image 
              src="/dashboard_preview.png" 
              alt="Tableau Dashboard Visual Interface" 
              width={1280} 
              height={800} 
              className="w-full h-auto object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-300"
            />
            {/* Fade connecting the image down to the box color */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a192f] via-[#0a192f]/20 to-transparent pointer-events-none opacity-50" />
          </div>

          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <BarChart2 className="w-5 h-5 text-[#4e9bb9]" />
                <span className="text-sm font-semibold text-[#4e9bb9] uppercase tracking-wider">
                  Live Executive Dashboard
                </span>
              </div>
              
              <h3 className="text-xl md:text-2xl font-bold text-white">Weather-Driven Consumer Experience</h3>
              
              <ul className="space-y-2 text-neutral-300 text-sm md:text-base">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1f77b4] shrink-0 mt-2" />
                  <span><strong>Cold Weather Paradox:</strong> Volume drops (101/day) but sentiment hits its highest (0.71)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1f77b4] shrink-0 mt-2" />
                  <span><strong>Extreme Heat:</strong> Causes radical drops to ~30 reviews/day with lowest sentiment (0.65)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1f77b4] shrink-0 mt-2" />
                  <span><strong>Resilience:</strong> Rain drops volume ~50% (143/day) but keeps sentiment stable (0.69)</span>
                </li>
              </ul>
            </div>
            
            <a
              href="https://public.tableau.com/app/profile/tirth.patel3716/viz/MSBA_405/Dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 inline-flex items-center gap-2 bg-[#1f77b4] hover:bg-[#4e9bb9] text-white font-bold rounded-full px-6 py-3 transition-colors shadow-lg"
            >
              Open in Tableau Public
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
