export type QuickLink = {
  id: string;
  labelKey: string;
  to: string;
  icon: 'star' | 'promo' | 'catalog';
};

export type ShopCategory = {
  id: string;
  labelKey: string;
  category?: string;
  tags?: string;
};

export const QUICK_LINKS: QuickLink[] = [
  { id: 'new', labelKey: 'nav.quick.new', to: '/catalog?tags=New', icon: 'star' },
  { id: 'promos', labelKey: 'nav.quick.promos', to: '/catalog?tags=Promo', icon: 'promo' },
  { id: 'catalog', labelKey: 'nav.quick.catalog', to: '/catalog', icon: 'catalog' },
];

export const SHOP_CATEGORIES: ShopCategory[] = [
  { id: 'fruit', labelKey: 'nav.categories.fruit', category: 'Fruit' },
  { id: 'vegetables', labelKey: 'nav.categories.vegetables', category: 'Vegetables' },
  { id: 'freshCut', labelKey: 'nav.categories.freshCut', category: 'Fresh Cut' },
  { id: 'driedFruit', labelKey: 'nav.categories.driedFruit', category: 'Dried Fruit' },
  { id: 'grosbusch', labelKey: 'nav.categories.grosbusch', category: 'Grosbusch' },
  { id: 'local', labelKey: 'nav.categories.local', tags: 'Local' },
  { id: 'organic', labelKey: 'nav.categories.organic', tags: 'Bio' },
  { id: 'juices', labelKey: 'nav.categories.juices', category: 'Juices' },
  { id: 'prePacked', labelKey: 'nav.categories.prePacked', category: 'Pre-packed' },
  { id: 'herbs', labelKey: 'nav.categories.herbs', category: 'Herbs' },
  { id: 'gifts', labelKey: 'nav.categories.gifts', category: 'Gifts' },
];

export const catalogHrefFor = (item: ShopCategory): string => {
  if (item.tags) return `/catalog?tags=${encodeURIComponent(item.tags)}`;
  if (item.category) return `/catalog?category=${encodeURIComponent(item.category)}`;
  return '/catalog';
};

export const isCategoryActive = (
  item: ShopCategory,
  params: URLSearchParams,
  pathname: string,
): boolean => {
  if (pathname !== '/catalog') return false;
  if (item.tags) return params.get('tags') === item.tags && !params.get('category');
  if (item.category) return params.get('category') === item.category;
  return false;
};

export const isQuickLinkActive = (
  to: string,
  params: URLSearchParams,
  pathname: string,
): boolean => {
  if (pathname !== '/catalog') return false;
  const target = new URL(to, 'http://local');
  if (target.pathname !== '/catalog') return false;
  const wantedTags = target.searchParams.get('tags');
  const wantedCategory = target.searchParams.get('category');
  if (!wantedTags && !wantedCategory) {
    return !params.get('category') && !params.get('tags') && !params.get('search');
  }
  if (wantedTags) return params.get('tags') === wantedTags;
  return params.get('category') === wantedCategory;
};
