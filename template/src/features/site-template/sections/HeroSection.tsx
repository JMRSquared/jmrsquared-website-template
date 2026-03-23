import { motion, type Variants } from 'framer-motion';
import { ArrowRight, CheckCircle2, Layers3, Sparkles } from 'lucide-react';

import { heroHighlights, heroPreviewCards, heroStackSummary } from '../content';
import { scrollToSection } from '../../../shared/lib/scroll';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1,
    },
  },
} satisfies Variants;

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: 'easeOut' as const,
    },
  },
} satisfies Variants;

const cardVariants = {
  hidden: { opacity: 0, scale: 0.9, rotate: -5 },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: -1,
    transition: {
      duration: 0.7,
      ease: 'easeOut' as const,
    },
  },
} satisfies Variants;

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-4 pt-24 pb-20 sm:px-6 sm:pt-32 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.14),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.12),_transparent_30%)]" />
      <div className="mx-auto max-w-7xl">
        <motion.div
          className="relative flex flex-col items-center gap-10 lg:grid lg:grid-cols-2 lg:gap-14"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants}>
            <motion.div
              className="mb-6 inline-flex items-center rounded-full border border-primary-100 bg-white/80 px-4 py-2 text-sm font-medium text-primary-700 shadow-sm backdrop-blur"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Premium starter for modern websites
            </motion.div>

            <motion.h1
              className="mb-5 text-4xl font-bold leading-tight text-gray-950 sm:mb-6 sm:text-5xl md:text-6xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              Build polished sites
              <motion.span
                className="text-primary-600"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                {' '}without starting from zero.
              </motion.span>
            </motion.h1>

            <motion.p
              className="mb-6 text-base leading-relaxed text-gray-600 sm:mb-8 sm:text-lg md:text-xl"
              variants={itemVariants}
            >
              This template keeps the stack, configuration, and packages in place while giving you a clean mobile-first foundation for high-end launches, portfolios, product pages, and company sites.
            </motion.p>

            <motion.div className="flex flex-col gap-4 sm:flex-row" variants={itemVariants}>
              <motion.button
                onClick={() => scrollToSection('start')}
                className="inline-flex items-center justify-center rounded-full bg-primary-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg transition-all hover:bg-primary-700 hover:shadow-xl sm:px-8 sm:py-4 sm:text-base"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Start With This Template
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </motion.button>

              <motion.button
                onClick={() => scrollToSection('features')}
                className="inline-flex items-center justify-center rounded-full border-2 border-gray-200 bg-white/80 px-6 py-3.5 text-sm font-semibold text-gray-900 backdrop-blur transition-all hover:bg-white sm:px-8 sm:py-4 sm:text-base"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Layers3 className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Explore Sections
              </motion.button>
            </motion.div>

            <motion.div
              className="mt-8 space-y-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              {heroHighlights.map((item) => (
                <div key={item} className="flex items-start gap-3 text-sm text-gray-600 sm:text-base">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-600" />
                  <span>{item}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>

          <div className="w-full">
            <motion.div
              className="relative mx-auto max-w-xl"
              variants={cardVariants}
              initial="hidden"
              animate="visible"
            >
              <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-primary-400 via-sky-400 to-cyan-300 opacity-90 blur-2xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-white/60 bg-white/85 p-5 shadow-2xl shadow-slate-300/50 backdrop-blur xl:p-6">
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-950 p-4 text-white">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Starter Preview</p>
                      <h2 className="mt-2 text-xl font-semibold">World-class website base</h2>
                    </div>
                    <div className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200">
                      Ready to adapt
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {heroPreviewCards.map((card) => {
                      const Icon = card.icon;

                      return (
                        <div key={card.title} className="rounded-2xl bg-white/5 p-4">
                          <Icon className="h-5 w-5 text-primary-300" />
                          <p className="mt-4 text-sm font-medium text-white">{card.title}</p>
                          <p className="mt-2 text-sm text-slate-300">{card.description}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {heroStackSummary.map((item) => (
                    <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{item.label}</p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
