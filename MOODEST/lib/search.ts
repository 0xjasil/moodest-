/**
 * Search and filtering utilities for Moryella
 */

export const PRICE_RANGES = [
  { label: 'Under ₹500', min: 0, max: 500 },
  { label: '₹500 - ₹1,000', min: 500, max: 1000 },
  { label: '₹1,000 - ₹2,500', min: 1000, max: 2500 },
  { label: '₹2,500 - ₹5,000', min: 2500, max: 5000 },
  { label: 'Above ₹5,000', min: 5000, max: 999999 },
] as const;

export const RATINGS = [
  { rating: 5, label: '5 stars' },
  { rating: 4, label: '4 stars & up' },
  { rating: 3, label: '3 stars & up' },
  { rating: 2, label: '2 stars & up' },
  { rating: 1, label: '1 star & up' },
] as const;

export const SORT_OPTIONS = [
  { value: 'relevance' as const, label: 'Relevance' },
  { value: 'price-asc' as const, label: 'Price: Low to High' },
  { value: 'price-desc' as const, label: 'Price: High to Low' },
  { value: 'rating' as const, label: 'Top Rated' },
  { value: 'newest' as const, label: 'Newest First' },
] as const;

/**
 * Format price range for display
 */
export function formatPriceRange(min: number, max: number): string {
  if (max === 999999) {
    return `₹${min.toLocaleString('en-IN')}+`;
  }
  return `₹${min.toLocaleString('en-IN')} - ₹${max.toLocaleString('en-IN')}`;
}

/**
 * Format rating with stars
 */
export function formatRating(rating: number, count?: number): string {
  const stars = '★'.repeat(Math.floor(rating));
  const emptyStars = '☆'.repeat(5 - Math.floor(rating));
  return `${stars}${emptyStars} ${rating.toFixed(1)}${count ? ` (${count})` : ''}`;
}

/**
 * Parse search query to extract filters
 */
export function parseSearchQuery(query: string) {
  const filters: Record<string, string> = {};
  
  // Parse price range: "under 500"
  const priceMatch = query.match(/under\s+(\d+)|price\s+(\d+)-(\d+)/i);
  if (priceMatch) {
    filters.price = priceMatch[0];
  }

  // Parse rating: "5 star" or "rated 4+"
  const ratingMatch = query.match(/(\d+)\s+star/i);
  if (ratingMatch) {
    filters.rating = ratingMatch[1];
  }

  // Parse brand: "brand: Apple"
  const brandMatch = query.match(/brand:\s+(\w+)/i);
  if (brandMatch) {
    filters.brand = brandMatch[1];
  }

  return filters;
}

/**
 * Get popular search suggestions
 */
export const POPULAR_SEARCHES = [
  'Lip gloss',
  'Face moisturizer',
  'Foundation',
  'Mascara',
  'Sunscreen',
  'Hair serum',
  'Face mask',
  'Cleanser',
  'Perfume',
  'Body lotion',
];

/**
 * Generate search suggestions based on query
 */
export function generateSuggestions(query: string, allSuggestions: string[]): string[] {
  const lowerQuery = query.toLowerCase();
  return allSuggestions
    .filter((s) => s.toLowerCase().includes(lowerQuery))
    .slice(0, 5);
}

/**
 * Build search URL with params
 */
export function buildSearchUrl(
  query: string,
  filters?: {
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    brand?: string;
    sortBy?: string;
    page?: number;
  }
): string {
  const params = new URLSearchParams();
  params.append('q', query);

  if (filters) {
    if (filters.minPrice) params.append('minPrice', filters.minPrice.toString());
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
    if (filters.minRating) params.append('minRating', filters.minRating.toString());
    if (filters.brand) params.append('brand', filters.brand);
    if (filters.sortBy) params.append('sort', filters.sortBy);
    if (filters.page) params.append('page', filters.page.toString());
  }

  return `/search?${params.toString()}`;
}

/**
 * Calculate facet counts based on products
 */
export function calculateFacets(products: any[]) {
  const brands = new Map<string, number>();
  const ratings = new Map<number, number>();

  products.forEach((product) => {
    // Count brands
    if (product.brand) {
      brands.set(product.brand, (brands.get(product.brand) || 0) + 1);
    }

    // Count ratings
    if (product.rating) {
      const ratingBucket = Math.floor(product.rating);
      ratings.set(ratingBucket, (ratings.get(ratingBucket) || 0) + 1);
    }
  });

  return {
    brands: Array.from(brands.entries()).map(([name, count]) => ({ name, count })),
    ratings: [5, 4, 3, 2, 1]
      .map((rating) => ({ rating, count: ratings.get(rating) || 0 }))
      .filter((r) => r.count > 0),
  };
}
