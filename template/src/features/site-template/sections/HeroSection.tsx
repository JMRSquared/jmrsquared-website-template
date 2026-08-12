import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { lazy, Suspense } from 'react';

import { siteConfig } from '../../../shared/config/site';
import { scrollToSection } from '../../../shared/lib/scroll';

const HeroCanvas = lazy(async () => {
  const module = await import('../components/HeroCanvas');
  return { default: module.HeroCanvas };
});

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] overflow-hidden bg-slate-950 text-white">
      <Suspense fallback={<div className="absolute inset-0 bg-slate-950" aria-hidden="true" />}>
        <HeroCanvas />
      </Suspense>
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/55 to-slate-950/20" />

      <div className="relative z-10 mx-auto flex min-h-[90vh] max-w-7xl items-center px-4 py-28 sm:px-6 lg:px-8">
        <motion.div
          className="max-w-2xl"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-teal-200/90">
            {siteConfig.appName}
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl md:text-6xl">
            A polished web presence, ready to own.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-200 sm:text-lg">
            {siteConfig.tagline}. Built as a live demo concept with scroll storytelling and real 3D craft.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => scrollToSection('start')}
              className="inline-flex items-center justify-center rounded-full bg-teal-500 px-6 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-teal-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-200"
              aria-label="Jump to the start section"
            >
              See the concept
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('features')}
              className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              aria-label="Explore the features section"
            >
              Explore sections
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
