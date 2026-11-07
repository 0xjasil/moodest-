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
      <main id="main-content" className="min-h-screen bg-[#F4F4F4]">
        <div className="mx-auto max-w-content px-4 md:px-6 py-8">
          {/* Search Bar */}
          <div className="mb-8">
            <SearchBar showSuggestions={true} />
          </div>

          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center gap-1.5 text-xs text-[#595E63]" role="list">
              <li role="listitem">
                <Link href="/" className="hover:text-[#E80071] hover:underline">
                  Home
                </Link>
              </li>
              <li role="listitem" aria-hidden="true">/</li>
              <li role="listitem" aria-current="page">
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
                <h1 className="text-2xl font-semibold text-[#000000]">
                  Search Results
                  {total > 0 && <span className="text-lg font-normal text-[#595E63]"> ({total})</span>}
                </h1>

                <div className="flex items-center gap-2">
                  <label className="text-sm text-[#595E63]">Sort by:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value as typeof sortBy)}
                    className="px-3 py-2 border border-[#CDD3D8] rounded-lg text-sm focus:border-[#E80071] focus:outline-none"
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
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Loading State */}
              {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="bg-white rounded-lg p-4 animate-pulse h-64"
                    />
                  ))}
                </div>
              ) : results.length === 0 ? (
                <div className="bg-white rounded-lg p-12 text-center border border-[#CDD3D8]">
                  <p className="text-lg font-semibold text-[#000000] mb-2">No products found</p>
                  <p className="text-sm text-[#595E63] mb-4">
                    Try adjusting your search or filters
                  </p>
                  <Link
                    href="/"
                    className="inline-block px-4 py-2 bg-[#E80071] text-white rounded-lg hover:opacity-90 transition-colors"
                  >
                    Browse All Products
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
                    <p className="text-sm text-[#595E63]">
                      Showing {results.length} of {total} products
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
