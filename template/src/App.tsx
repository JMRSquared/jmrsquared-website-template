import { DemoPreviewBanner } from './shared/components/DemoPreviewBanner';
import { JmrSquaredAttribution } from './shared/components/JmrSquaredAttribution';
import { siteConfig } from './shared/config/site';

export function App() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-surface">
      <DemoPreviewBanner />
      <main className="flex flex-1 items-center justify-center px-6 py-24">
        <h1 className="text-2xl font-semibold text-neutral-900">{siteConfig.appName}</h1>
      </main>
      <JmrSquaredAttribution />
    </div>
  );
}
