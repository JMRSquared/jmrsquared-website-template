import { jmrSquaredAttribution } from '../config/attribution';
import { demoPreview } from '../config/demo-preview';

export function JmrSquaredAttribution() {
  return (
    <aside
      className="border-t border-slate-200 bg-slate-50 px-4 py-5 sm:px-6 lg:px-8"
      aria-label="Website attribution"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-3 text-sm leading-6 text-slate-600">
        <p className="max-w-3xl text-slate-500">{demoPreview.attributionContext}</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p>
            {jmrSquaredAttribution.creditLabel}{' '}
            <a
              href={jmrSquaredAttribution.studioUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-slate-900 underline decoration-slate-300 underline-offset-4 transition hover:decoration-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            >
              {jmrSquaredAttribution.studioName}
            </a>
            {' · '}
            <a
              href={jmrSquaredAttribution.studioUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-slate-300 underline-offset-4 transition hover:decoration-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            >
              tech.jmrsquared.com
            </a>
          </p>
          <p>
            {jmrSquaredAttribution.similarSiteMessage}{' '}
            <a
              href={jmrSquaredAttribution.contactMailto}
              className="font-medium text-slate-900 underline decoration-slate-300 underline-offset-4 transition hover:decoration-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            >
              {jmrSquaredAttribution.contactEmail}
            </a>
          </p>
        </div>
      </div>
    </aside>
  );
}
