import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

import { showcaseItems, showcaseStats } from '../content';

export function ShowcaseSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-120px' });

  return (
    <section id="showcase" ref={sectionRef} className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <p className="section-eyebrow">Showcase patterns</p>
          <h2 className="section-title max-w-2xl">Use these starter patterns for featured work, proof, services, or stories.</h2>
          <p className="section-copy max-w-2xl">
            The layout stays intentionally broad so it can support many website types. Use this area for featured work, differentiators, testimonials, galleries, editorial blocks, or product proof.
          </p>

          <div className="mt-10 grid gap-4">
            {showcaseItems.map((item, index) => {
              const Icon = item.icon;

              return (
                <motion.article
                  key={item.title}
                  className="rounded-[2rem] border border-slate-200 bg-white/85 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.45, delay: index * 0.1 }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900">{item.title}</h3>
                      <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600">{item.description}</p>
                    </div>
                    <div className="rounded-full border border-slate-200 p-2 text-slate-500">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          className="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-2xl shadow-slate-300/40"
          initial={{ opacity: 0, x: 24 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.65, delay: 0.1 }}
        >
          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Starter notes</p>
            <h3 className="mt-4 text-2xl font-semibold">Keep the stack. Change the story.</h3>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              Vite, React, Tailwind, Framer Motion, and Lucide already give you a strong base for world-class websites. Most of the impact comes from strong art direction, careful spacing, fast images, and intentional motion.
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {showcaseStats.map((item, index) => {
              const Icon = item.icon;

              return (
                <motion.div
                  key={item.label}
                  className="rounded-3xl border border-white/10 bg-white/5 p-5"
                  initial={{ opacity: 0, y: 18 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.45, delay: 0.2 + index * 0.1 }}
                >
                  <Icon className="h-5 w-5 text-primary-300" />
                  <p className="mt-4 text-xs uppercase tracking-[0.25em] text-slate-400">{item.label}</p>
                  <p className="mt-2 text-lg font-semibold text-white">{item.value}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
