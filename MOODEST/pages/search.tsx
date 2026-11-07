import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSearch } from '@/context/SearchContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import SearchFilters from '@/components/SearchFilters';
import SearchBar from '@/components/SearchBar';

export default function SearchPage() {
  const router = useRouter();
  const { q } = router.query;
  const { results, total, filters, search, setFilter, isLoading, error } = useSearch();
  const [sortBy, setSortBy] = useState<'relevance' | 'price-asc' | 'price-desc' | 'rating' | 'newest'>('relevance');

  useEffect(() => {
    if (q) {
      search({
        query: q as string,
        sortBy,
        page: 1,
        limit: 20,
      });
    }
  }, [q, sortBy, search]);

  const handleSortChange = (newSort: typeof sortBy) => {
    setSortBy(newSort);
    setFilter({ sortBy: newSort, page: 1 });
  };

  const handleFiltersApply = () => {
    search({
      ...filters,
      sortBy,
    });
  };

  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen bg-mb-bg">
        <div className="mx-auto max-w-content px-4 md:px-6 py-8">
          {/* Search Bar */}
          <div className="mb-8">
            <SearchBar showSuggestions={true} />
          </div>

          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center gap-1.5 text-xs text-mb-muted" role="list">
              <li role="listitem">
                <Link href="/" className="hover:text-mb-primary transition-colors">
                  Home
                </Link>
              </li>
              <li role="listitem" aria-hidden="true" className="text-mb-dusty">/</li>
              <li role="listitem" aria-current="page" className="text-mb-text font-semibold">
                Search Results {q && `for "${q}"`}
              </li>
            </ol>
          </nav>

          <div className="grid md:grid-cols-4 gap-6">
            {/* Sidebar: Filters */}
            <div className="md:col-span-1">
              <SearchFilters onFiltersChange={handleFiltersApply} />
            </div>

            {/* Main: Results */}
            <div className="md:col-span-3">
              {/* Header with Sort */}
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-serif font-semibold text-mb-text">
                  Search Results
                  {total > 0 && <span className="text-sm font-sans font-normal text-mb-muted"> ({total})</span>}
                </h1>

                <div className="flex items-center gap-2">
                  <label className="text-xs text-mb-muted font-medium">Sort by:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value as typeof sortBy)}
                    className="px-3 py-1.5 border border-mb-border rounded-[8px] bg-mb-surface text-xs text-mb-text focus:border-mb-primary focus:outline-none"
                  >
                    <option value="relevance">Relevance</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="rating">Top Rated</option>
                    <option value="newest">Newest</option>
                  </select>
                </div>
              </div>

              {/* Error State */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-[8px]">
                  <p className="text-xs text-red-700">{error}</p>
                </div>
              )}

              {/* Loading State */}
              {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="bg-mb-surface border border-mb-border rounded-[8px] p-4 animate-pulse h-64"
                    />
                  ))}
                </div>
              ) : results.length === 0 ? (
                <div className="bg-mb-surface rounded-[8px] p-12 text-center border border-mb-border shadow-card">
                  <p className="text-base font-semibold text-mb-text mb-2">No creations found</p>
                  <p className="text-xs text-mb-muted mb-4">
                    Try adjusting your search terms or filters
                  </p>
                  <Link
                    href="/"
                    className="inline-block px-5 py-2.5 bg-[#5C1A24] text-white text-xs font-semibold rounded-[8px] hover:bg-[#42121B] transition-colors"
                  >
                    Browse All Collections
                  </Link>
                </div>
              ) : (
                <>
                  {/* Product Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                    {results.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>

                  {/* Pagination Info */}
                  <div className="text-center py-6">
                    <p className="text-xs text-mb-muted">
                      Showing {results.length} of {total} creations
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
