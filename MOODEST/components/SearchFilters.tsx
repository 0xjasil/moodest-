'use client';

import React, { useState } from 'react';
import { useSearch } from '@/context/SearchContext';

interface SearchFiltersProps {
  onFiltersChange?: () => void;
}

export default function SearchFiltersPanel({ onFiltersChange }: SearchFiltersProps) {
  const { filters, setFilter, facets, resetFilters } = useSearch();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    price: true,
    rating: true,
    brand: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handlePriceChange = (min?: number, max?: number) => {
    setFilter({ minPrice: min, maxPrice: max, page: 1 });
    onFiltersChange?.();
  };

  const handleRatingChange = (rating: number) => {
    setFilter({
      minRating: filters.minRating === rating ? undefined : rating,
      page: 1,
    });
    onFiltersChange?.();
  };

  const handleBrandChange = (brand: string) => {
    setFilter({
      brand: filters.brand === brand ? undefined : brand,
      page: 1,
    });
    onFiltersChange?.();
  };

  const handleReset = () => {
    resetFilters();
    onFiltersChange?.();
  };

  const hasActiveFilters =
    filters.minPrice || filters.maxPrice || filters.minRating || filters.brand;

  return (
    <div className="bg-mb-surface rounded-[8px] p-5 border border-mb-border shadow-card">
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-base font-semibold text-mb-text">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={handleReset}
            className="text-xs text-[#5C1A24] hover:underline font-semibold"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Price Filter */}
      <div className="mb-5 pb-5 border-b border-mb-border">
        <button
          onClick={() => toggleSection('price')}
          className="flex justify-between items-center w-full mb-3 text-xs font-semibold text-mb-text"
        >
          <span>Price</span>
          <span className="text-mb-muted">{expandedSections.price ? '−' : '+'}</span>
        </button>

        {expandedSections.price && (
          <div className="space-y-2">
            {[
              { label: 'Under ₹2,000', min: 0, max: 2000 },
              { label: '₹2,000 - ₹5,000', min: 2000, max: 5000 },
              { label: '₹5,000 - ₹10,000', min: 5000, max: 10000 },
              { label: 'Above ₹10,000', min: 10000, max: 999999 },
            ].map((range) => (
              <label key={range.label} className="flex items-center gap-2 cursor-pointer text-xs text-mb-body hover:text-mb-text">
                <input
                  type="radio"
                  name="price"
                  checked={filters.minPrice === range.min && filters.maxPrice === range.max}
                  onChange={() => handlePriceChange(range.min, range.max)}
                  className="w-3.5 h-3.5 accent-[#5C1A24] rounded border-mb-border"
                />
                <span>{range.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Rating Filter */}
      <div className="mb-5 pb-5 border-b border-mb-border">
        <button
          onClick={() => toggleSection('rating')}
          className="flex justify-between items-center w-full mb-3 text-xs font-semibold text-mb-text"
        >
          <span>Customer Rating</span>
          <span className="text-mb-muted">{expandedSections.rating ? '−' : '+'}</span>
        </button>

        {expandedSections.rating && (
          <div className="space-y-2">
            {(facets.ratings.length > 0 ? facets.ratings : [
              { rating: 4, count: 12 },
              { rating: 3, count: 5 }
            ]).map((item) => (
              <label
                key={item.rating}
                className="flex items-center justify-between cursor-pointer text-xs text-mb-body hover:text-mb-text"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="rating"
                    checked={filters.minRating === item.rating}
                    onChange={() => handleRatingChange(item.rating)}
                    className="w-3.5 h-3.5 accent-[#5C1A24] rounded border-mb-border"
                  />
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={`text-xs ${
                          i < item.rating ? 'text-[#C6A477]' : 'text-mb-dusty'
                        }`}
                      >
                        ★
                      </span>
                    ))}
                    <span className="text-[11px] text-mb-muted ml-1">& up</span>
                  </div>
                </div>
                <span className="text-[11px] text-mb-muted">({item.count})</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Brand Filter */}
      <div>
        <button
          onClick={() => toggleSection('brand')}
          className="flex justify-between items-center w-full mb-3 text-xs font-semibold text-mb-text"
        >
          <span>Collection / Brand</span>
          <span className="text-mb-muted">{expandedSections.brand ? '−' : '+'}</span>
        </button>

        {expandedSections.brand && (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {facets.brands.map((brand) => (
              <label key={brand.name} className="flex items-center justify-between cursor-pointer text-xs text-mb-body hover:text-mb-text">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.brand === brand.name}
                    onChange={() => handleBrandChange(brand.name)}
                    className="w-3.5 h-3.5 accent-[#5C1A24] rounded border-mb-border"
                  />
                  <span>{brand.name}</span>
                </div>
                <span className="text-[11px] text-mb-muted">({brand.count})</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
