'use client';

import React, { useState } from 'react';
import { useSearch, type SearchFilters } from '@/context/SearchContext';

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
    <div className="bg-white rounded-lg p-6 border border-[#CDD3D8]">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-[#000000]">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={handleReset}
            className="text-sm text-[#E80071] hover:underline font-medium"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Price Filter */}
      <div className="mb-6 pb-6 border-b border-[#CDD3D8]">
        <button
          onClick={() => toggleSection('price')}
          className="flex justify-between items-center w-full mb-3"
        >
          <h4 className="font-semibold text-[#000000]">Price</h4>
          <span className="text-[#595E63]">{expandedSections.price ? '−' : '+'}</span>
        </button>

        {expandedSections.price && (
          <div className="space-y-2">
            {[
              { label: 'Under ₹500', min: 0, max: 500 },
              { label: '₹500 - ₹1,000', min: 500, max: 1000 },
              { label: '₹1,000 - ₹2,500', min: 1000, max: 2500 },
              { label: '₹2,500 - ₹5,000', min: 2500, max: 5000 },
              { label: 'Above ₹5,000', min: 5000, max: 999999 },
            ].map((range) => (
              <label key={range.label} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="price"
                  checked={filters.minPrice === range.min && filters.maxPrice === range.max}
                  onChange={() => handlePriceChange(range.min, range.max)}
                  className="w-4 h-4 rounded border-[#CDD3D8]"
                />
                <span className="text-sm text-[#595E63]">{range.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Rating Filter */}
      <div className="mb-6 pb-6 border-b border-[#CDD3D8]">
        <button
          onClick={() => toggleSection('rating')}
          className="flex justify-between items-center w-full mb-3"
        >
          <h4 className="font-semibold text-[#000000]">Rating</h4>
          <span className="text-[#595E63]">{expandedSections.rating ? '−' : '+'}</span>
        </button>

        {expandedSections.rating && (
          <div className="space-y-2">
            {facets.ratings.map((item) => (
              <label
                key={item.rating}
                className="flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="rating"
                    checked={filters.minRating === item.rating}
                    onChange={() => handleRatingChange(item.rating)}
                    className="w-4 h-4 rounded border-[#CDD3D8]"
                  />
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={`text-sm ${
                          i < item.rating ? 'text-[#E80071]' : 'text-[#CDD3D8]'
                        }`}
                      >
                        ★
                      </span>
                    ))}
                    <span className="text-xs text-[#595E63] ml-1">& up</span>
                  </div>
                </div>
                <span className="text-xs text-[#595E63]">({item.count})</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Brand Filter */}
      <div>
        <button
          onClick={() => toggleSection('brand')}
          className="flex justify-between items-center w-full mb-3"
        >
          <h4 className="font-semibold text-[#000000]">Brand</h4>
          <span className="text-[#595E63]">{expandedSections.brand ? '−' : '+'}</span>
        </button>

        {expandedSections.brand && (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {facets.brands.map((brand) => (
              <label key={brand.name} className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.brand === brand.name}
                    onChange={() => handleBrandChange(brand.name)}
                    className="w-4 h-4 rounded border-[#CDD3D8]"
                  />
                  <span className="text-sm text-[#595E63]">{brand.name}</span>
                </div>
                <span className="text-xs text-[#595E63]">({brand.count})</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
