import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRecommendation, Product } from "@/context/RecommendationContext";
import { useAuth } from "@/context/AuthContext";

export default function RecommendedProducts() {
  const { user } = useAuth();
  const { recommendations, isLoading, fetchRecommendations } =
    useRecommendation();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    loadRecommendations();
  }, [user]);

  const loadRecommendations = async () => {
    try {
      const activeUserId = user?.id ? Number(user.id) || 0 : 0;
      await fetchRecommendations(activeUserId);
    } catch (error) {
      console.error("Failed to load recommendations:", error);
    }
  };

  useEffect(() => {
    if (recommendations.personalized) {
      setProducts(recommendations.personalized.slice(0, 8));
    }
  }, [recommendations]);

  if (isLoading) {
    return (
      <section className="py-8 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
              <p className="mt-2 text-gray-600">Loading recommendations...</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="py-8 bg-white border-t border-gray-200">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Recommended For You
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Based on your browsing history
            </p>
          </div>
          <Link href="/recommendations">
            <button className="text-pink-600 hover:text-pink-700 font-medium text-sm">
              View All →
            </button>
          </Link>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}

interface ProductCardProps {
  product: Product;
}

function ProductCard({ product }: ProductCardProps) {
  return (
    <Link href={`/product/${product.id}`}>
      <div className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition overflow-hidden cursor-pointer group">
        {/* Image */}
        <div className="relative aspect-square bg-gray-100 overflow-hidden">
          <img
            src={product.image}
            alt={`${product.name} — Recommended Luxury Abaya | Modest Studio`}
            className="w-full h-full object-cover object-top group-hover:scale-105 transition duration-300"
          />
          {product.discount && (
            <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
              -{product.discount}%
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            {product.category}
          </p>
          <h4 className="font-medium text-gray-900 text-sm mb-2 line-clamp-2 group-hover:text-pink-600 transition">
            {product.name}
          </h4>
          <div className="flex items-center justify-between">
            <p className="font-bold text-gray-900 text-sm">
              ₹{product.price.toLocaleString()}
            </p>
            <div className="flex items-center">
              <span className="text-yellow-400 text-xs">★</span>
              <span className="text-gray-600 text-xs ml-0.5">
                {product.rating}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
