import { siteConfig } from '../../../shared/config/site';

export function FooterSection() {
  return (
    <footer className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl rounded-[2rem] border border-slate-200 bg-slate-950 px-6 py-10 text-white sm:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <p className="text-lg font-semibold">{siteConfig.appName}</p>
            <p className="mt-3 text-sm leading-7 text-slate-400">{siteConfig.footerDescription}</p>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">Included</p>
            <p className="mt-3 text-sm leading-7 text-slate-400">
              Vite, React, TypeScript, Tailwind CSS, Framer Motion, Lucide, and the existing project configuration stay in place.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">Customize</p>
            <p className="mt-3 text-sm leading-7 text-slate-400">
              Replace the current copy, connect your assets and forms, and expand this into the website structure your brand requires.
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-white/10 pt-6 text-sm text-slate-500">
          © {new Date().getFullYear()} {siteConfig.appName}. Ready to adapt.
        </div>
      </div>
    </footer>
  );
}
