import { showcaseItems, showcaseStats } from '../content';
import { useScrollReveal } from '../hooks/useScrollReveal';

export function ShowcaseSection() {
  const sectionRef = useScrollReveal();

  return (
    <section id="showcase" ref={sectionRef} className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <div data-scroll-reveal>
          <p className="section-eyebrow">Showcase patterns</p>
          <h2 className="section-title max-w-2xl">
            Use these starter patterns for featured work, proof, services, or stories.
          </h2>
          <p className="section-copy max-w-2xl">
            Scroll-linked motion is baked in with GSAP ScrollTrigger. Replace this content with brand-true proof for the company demo.
          </p>

          <div className="mt-10 grid gap-4">
            {showcaseItems.map((item) => {
              const Icon = item.icon;

              return (
                <article
                  key={item.title}
                  data-scroll-reveal
                  className="rounded-[2rem] border border-slate-200 bg-white/85 p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900">{item.title}</h3>
                      <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600">{item.description}</p>
                    </div>
                    <div className="rounded-full border border-slate-200 p-2 text-slate-500">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <div
          data-scroll-reveal
          className="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-2xl shadow-slate-300/40"
        >
          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Motion stack</p>
            <h3 className="mt-4 text-2xl font-semibold">R3F hero. GSAP scroll. Motion micro-interactions.</h3>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              Keep the 3D scene and scroll storytelling. Swap geometry, lighting, and copy to match the brand story.
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {showcaseStats.map((item) => {
              const Icon = item.icon;

              return (
                <div key={item.label} data-scroll-reveal className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <Icon className="h-5 w-5 text-primary-300" aria-hidden="true" />
                  <p className="mt-4 text-xs uppercase tracking-[0.25em] text-slate-400">{item.label}</p>
                  <p className="mt-2 text-lg font-semibold text-white">{item.value}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
