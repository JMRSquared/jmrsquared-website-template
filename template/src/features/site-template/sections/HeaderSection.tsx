import { AnimatePresence, motion } from 'framer-motion';
import { Menu, Sparkles, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { navigationSections } from '../content';
import { siteConfig } from '../../../shared/config/site';
import { scrollToSection, scrollToTop } from '../../../shared/lib/scroll';

function getNavLinkClass(activeSection: string, sectionId: string, isMobile = false): string {
  if (sectionId === 'start') {
    return activeSection === 'start'
      ? 'bg-primary-700 text-white px-5 py-2.5 rounded-full hover:bg-primary-800 transition-colors font-medium'
      : 'bg-primary-600 text-white px-5 py-2.5 rounded-full hover:bg-primary-700 transition-colors font-medium';
  }

  if (isMobile) {
    return activeSection === sectionId
      ? 'text-primary-600 font-semibold transition-colors'
      : 'text-gray-700 hover:text-primary-600 transition-colors font-medium';
  }

  return activeSection === sectionId
    ? 'text-primary-600 border-b-2 border-primary-600 pb-1 transition-colors font-medium'
    : 'text-gray-700 hover:text-primary-600 transition-colors font-medium';
}

export function HeaderSection() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    const trackedSections: { id: string; element: HTMLElement; ratio: number }[] = [];

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = trackedSections.findIndex(({ id }) => id === entry.target.id);

          if (index >= 0) {
            trackedSections[index].ratio = entry.intersectionRatio;
          }
        });

        const visibleSections = trackedSections.filter(({ ratio }) => ratio > 0);

        if (visibleSections.length === 0) {
          return;
        }

        const mostVisibleSection = visibleSections.reduce((currentBest, candidate) =>
          candidate.ratio > currentBest.ratio ? candidate : currentBest,
        );

        setActiveSection(mostVisibleSection.id);
      },
      {
        threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
        rootMargin: '-100px 0px -40% 0px',
      },
    );

    navigationSections.forEach(({ id }) => {
      const section = document.getElementById(id);

      if (!section) {
        return;
      }

      trackedSections.push({ id, element: section, ratio: 0 });
      observer.observe(section);
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';

    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  function handleScrollToSection(sectionId: string): void {
    scrollToSection(sectionId);
    setIsMenuOpen(false);
  }

  function handleScrollToTop(): void {
    scrollToTop();
    setIsMenuOpen(false);
    setActiveSection('');
  }

  return (
    <>
      <header className="fixed top-[3.75rem] left-0 right-0 z-50 w-full overflow-hidden border-b border-white/60 bg-white/80 shadow-sm backdrop-blur-xl sm:top-11">
        <nav className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between md:h-20">
            <button
              onClick={handleScrollToTop}
              className="flex cursor-pointer items-center space-x-3 transition-opacity hover:opacity-80"
              aria-label="Scroll to top"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-lg shadow-primary-200/60">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-900">{siteConfig.appName}</p>
                <p className="text-xs text-gray-500">{siteConfig.tagline}</p>
              </div>
            </button>

            <div className="hidden items-center space-x-6 md:flex lg:space-x-8">
              {navigationSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => handleScrollToSection(section.id)}
                  className={getNavLinkClass(activeSection, section.id)}
                >
                  {section.label}
                </button>
              ))}
            </div>

            <button
              className="relative z-50 -mr-2 p-2 md:hidden"
              onClick={() => setIsMenuOpen((currentValue) => !currentValue)}
              aria-label="Toggle menu"
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </nav>
      </header>

      <AnimatePresence>
        {isMenuOpen ? (
          <>
            <motion.div
              className="fixed inset-0 z-[60] bg-black/50 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsMenuOpen(false)}
            />
            <motion.div
              className="fixed top-0 right-0 z-[70] h-full w-72 max-w-[85vw] overflow-hidden bg-white shadow-2xl sm:w-80 md:hidden"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b p-4 sm:p-6">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{siteConfig.appName}</p>
                    <p className="text-xs text-gray-500">{siteConfig.menuTagline}</p>
                  </div>
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className="rounded-lg p-2 transition-colors hover:bg-gray-100"
                    aria-label="Close menu"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <nav className="flex-1 overflow-y-auto p-4 sm:p-6">
                  <div className="flex flex-col space-y-1">
                    {navigationSections.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => handleScrollToSection(section.id)}
                        className={`${getNavLinkClass(activeSection, section.id, true)} rounded-lg px-4 py-3 text-left transition-colors hover:bg-gray-50 ${section.id === 'start' ? 'mt-2 w-full' : ''}`}
                      >
                        {section.label}
                      </button>
                    ))}
                  </div>

                  <div className="mt-8 rounded-2xl border border-primary-100 bg-primary-50 p-5">
                    <p className="text-sm font-semibold text-gray-900">Ready to customize</p>
                    <p className="mt-2 text-sm leading-relaxed text-gray-600">
                      Swap in your content, connect your forms, and replace the starter sections with the exact experience you need.
                    </p>
                  </div>
                </nav>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
