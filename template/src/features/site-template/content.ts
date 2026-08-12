import type { LucideIcon } from 'lucide-react';
import {
  ArrowUpRight,
  Gauge,
  Image,
  Images,
  LayoutTemplate,
  MonitorPlay,
  MousePointer2,
  Paintbrush2,
  Scaling,
  Sparkles,
  Zap,
} from 'lucide-react';

export type NavigationSection = {
  id: string;
  label: string;
};

export type FeatureCard = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export type ShowcaseItem = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export type ShowcaseStat = {
  label: string;
  value: string;
  icon: LucideIcon;
};

export const navigationSections: NavigationSection[] = [
  { id: 'features', label: 'Features' },
  { id: 'showcase', label: 'Showcase' },
  { id: 'start', label: 'Start Here' },
];

export const featureCards: FeatureCard[] = [
  {
    icon: LayoutTemplate,
    title: 'Flexible page structure',
    description: 'A neutral layout that can become a product launch, studio site, portfolio, or campaign page.',
  },
  {
    icon: Scaling,
    title: 'Mobile-first by default',
    description: 'Responsive sections and spacing are tuned to feel intentional on phones before scaling up.',
  },
  {
    icon: Paintbrush2,
    title: 'Easy to rebrand',
    description: 'Swap colors, type, copy, and CTA flows without touching the underlying project setup.',
  },
  {
    icon: Zap,
    title: '3D and scroll motion baked in',
    description: 'React Three Fiber, Drei, GSAP ScrollTrigger, and Motion ship with the starter so premium motion is the default.',
  },
  {
    icon: Image,
    title: 'Built for strong visuals',
    description: 'Use the clean showcase patterns as a base for high-quality imagery and art direction.',
  },
  {
    icon: MousePointer2,
    title: 'Clear conversion paths',
    description: 'The starter keeps calls to action simple so you can connect forms, booking flows, or product funnels later.',
  },
];

export const showcaseItems: ShowcaseItem[] = [
  {
    title: 'Launch Pages',
    description: 'Use bold headlines, image-led storytelling, and focused CTAs for product or service launches.',
    icon: Sparkles,
  },
  {
    title: 'Brand Websites',
    description: 'Build clean corporate, studio, or consultancy sites with adaptable sections and a polished rhythm.',
    icon: LayoutTemplate,
  },
  {
    title: 'Portfolio Experiences',
    description: 'Turn the showcase cards into case studies, galleries, team stories, or editorial layouts.',
    icon: ArrowUpRight,
  },
];

export const showcaseStats: ShowcaseStat[] = [
  { label: 'Designed for', value: 'Mobile first', icon: Gauge },
  { label: 'Visual style', value: 'Clean and flexible', icon: Images },
  { label: 'Interaction level', value: '3D + scroll ready', icon: MonitorPlay },
];

export const ctaChecklist: string[] = [
  'Replace the starter copy with your brand voice',
  'Add photography, renders, or product visuals that fit the site direction',
  'Connect the final CTA to your real form, CRM, or booking flow',
];
