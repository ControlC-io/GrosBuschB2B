export interface BadgeStyle {
  translationKey: string;
  className: string;
}

/**
 * Visual mapping for the quality and merchandising tags carried by products.
 * Keys are normalized tag values, so "Coming soon" resolves to "comingsoon".
 */
export const BADGE_STYLES: Record<string, BadgeStyle> = {
  new: { translationKey: 'catalog.badges.new', className: 'bg-primary text-white' },
  promo: { translationKey: 'catalog.badges.promo', className: 'bg-brand-orange text-white' },
  bio: { translationKey: 'catalog.badges.bio', className: 'bg-brand-green text-white' },
  fairtrade: { translationKey: 'catalog.badges.fairtrade', className: 'bg-emerald-700 text-white' },
  local: { translationKey: 'catalog.badges.local', className: 'bg-sky-700 text-white' },
  fresh: { translationKey: 'catalog.badges.fresh', className: 'bg-teal-600 text-white' },
  seasonal: { translationKey: 'catalog.badges.seasonal', className: 'bg-amber-600 text-white' },
  comingsoon: { translationKey: 'catalog.badges.comingSoon', className: 'bg-slate-500 text-white' },
  preorder: { translationKey: 'catalog.badges.preOrder', className: 'bg-violet-700 text-white' },
  luxury: { translationKey: 'catalog.badges.luxury', className: 'bg-neutral-900 text-white' },
};

export const NEUTRAL_BADGE_CLASS = 'bg-slate-200 text-slate-800';

export const badgeKey = (tag: string): string => tag.toLowerCase().replace(/[^a-z]/g, '');

export const badgeStyleFor = (tag: string): BadgeStyle | undefined => BADGE_STYLES[badgeKey(tag)];
