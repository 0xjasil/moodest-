'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useSearch } from '@/context/SearchContext';

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  showSuggestions?: boolean;
}

export default function SearchBar({
  placeholder = 'Search products...',
  onSearch,
  showSuggestions = true,
}: SearchBarProps) {
  const router = useRouter();
  const { getSuggestions, suggestions, clearSuggestions, setFilter, search, filters } = useSearch();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query && showSuggestions) {
        getSuggestions(query);
        setIsOpen(true);
      } else {
        clearSuggestions();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, getSuggestions, clearSuggestions, showSuggestions]);

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    setFilter({ query: searchQuery, page: 1 });
    onSearch?.(searchQuery);

    // Navigate to search page if not already there
    if (router.pathname !== '/search') {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }

    setIsOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      handleSearch(query.trim());
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSearch(suggestion);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query && setIsOpen(true)}
            placeholder={placeholder}
            className="w-full px-4 py-2.5 pr-12 border border-[#CDD3D8] rounded-lg bg-white text-[#000000] placeholder-[#595E63] focus:border-[#E80071] focus:outline-none focus:ring-1 focus:ring-[#E80071]"
          />
          <button
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#595E63] hover:text-[#E80071] transition-colors"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="8" cy="8" r="6" />
              <path d="M13 13l4 4" />
            </svg>
          </button>
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#CDD3D8] rounded-lg shadow-md z-50">
          <div className="p-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full text-left px-3 py-2 hover:bg-[#F4F4F4] rounded text-sm text-[#595E63] hover:text-[#000000] transition-colors"
              >
                <span className="text-[#E80071] mr-2">🔍</span>
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
