import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useRef } from 'react';

gsap.registerPlugin(ScrollTrigger);

export function useScrollReveal() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) {
      return;
    }

    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (media.matches) {
      return;
    }

    const targets = section.querySelectorAll('[data-scroll-reveal]');
    const ctx = gsap.context(() => {
      gsap.fromTo(
        targets,
        { opacity: 0, y: 48 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.12,
          scrollTrigger: {
            trigger: section,
            start: 'top 75%',
            end: 'top 35%',
            scrub: 0.6,
          },
        },
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return sectionRef;
}
