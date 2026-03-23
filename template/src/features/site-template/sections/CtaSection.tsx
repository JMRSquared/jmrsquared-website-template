import { motion } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';

import { ctaChecklist } from '../content';
import { scrollToTop } from '../../../shared/lib/scroll';

export function CtaSection() {
  return (
    <section id="start" className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <motion.div
          className="overflow-hidden rounded-[2rem] border border-primary-100 bg-gradient-to-br from-primary-600 via-sky-600 to-cyan-500 px-6 py-10 text-white shadow-2xl shadow-primary-200/40 sm:px-10 lg:px-12"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-120px' }}
          transition={{ duration: 0.6 }}
        >
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-white/70">Start here</p>
              <h2 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
                A clean launchpad for your next world-class website.
              </h2>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-white/85 sm:text-base">
                This starter is intentionally neutral so you can keep the project setup, replace the current sections, and shape it into the exact site you need.
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <button
                  onClick={scrollToTop}
                  className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-slate-950 transition-transform hover:scale-[1.02]"
                >
                  Back to top
                </button>
                <a
                  href="#features"
                  className="inline-flex items-center justify-center rounded-full border border-white/30 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  Review starter sections
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-white/15 bg-slate-950/20 p-6 backdrop-blur-sm">
              <p className="text-sm font-semibold text-white">Suggested first steps</p>
              <div className="mt-5 space-y-4">
                {ctaChecklist.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-white/15">
                      <Check className="h-4 w-4" />
                    </div>
                    <p className="text-sm leading-7 text-white/85">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
