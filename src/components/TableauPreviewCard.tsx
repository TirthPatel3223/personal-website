"use client";

import { motion, Variants } from "framer-motion";
import { BarChart2, ExternalLink } from "lucide-react";

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
        <h2 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">
          Tableau Dashboard Preview
        </h2>
        <div className="flex-1 h-px bg-neutral-800" />
      </div>

      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="w-full bg-neutral-900 border border-teal-500/30 rounded-2xl p-8 hover:shadow-[0_0_30px_rgba(20,184,166,0.12)] transition-shadow duration-300"
      >
        <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-teal-400" />
              <span className="text-sm font-semibold text-teal-400 uppercase tracking-wider">
                Dashboard Preview
              </span>
            </div>
            
            <h3 className="text-xl md:text-2xl font-bold text-white">Yelp & Weather Intelligence Dashboard</h3>
            
            <ul className="space-y-2 text-neutral-400">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500/50" />
                Precipitation vs. average review volume by city
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500/50" />
                Temperature bands vs. star rating distribution
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500/50" />
                Sentiment heatmap by weather condition
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500/50" />
                Weather-driven revenue anomaly detection
              </li>
            </ul>
          </div>
          
          <a
            href="https://public.tableau.com/app/profile/tirth.patel3716/viz/MSBA_405/Dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-neutral-950 font-bold rounded-full px-6 py-3 transition-colors"
          >
            Open in Tableau Public
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </motion.div>
    </section>
  );
}
