import { jmrSquaredAttribution } from '../config/attribution';
import { demoPreview } from '../config/demo-preview';

export function DemoPreviewBanner() {
  return (
    <div
      className="sticky top-0 z-[60] border-b border-amber-300/80 bg-amber-50 px-4 py-2.5 text-amber-950 sm:px-6"
      role="status"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-1 text-xs leading-5 sm:flex-row sm:items-center sm:justify-between sm:text-sm">
        <p>
          <span className="font-semibold">{demoPreview.badgeLabel}</span>
          {' — '}
          {demoPreview.bannerMessage}
        </p>
        <p className="sm:text-right">
          Questions?{' '}
          <a
            href={jmrSquaredAttribution.contactMailto}
            className="font-medium underline decoration-amber-400 underline-offset-2 hover:decoration-amber-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-800"
          >
            {jmrSquaredAttribution.contactEmail}
          </a>
          {' · '}
          <a
            href={jmrSquaredAttribution.studioUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline decoration-amber-400 underline-offset-2 hover:decoration-amber-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-800"
          >
            tech.jmrsquared.com
          </a>
        </p>
      </div>
    </div>
  );
}
