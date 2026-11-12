import React, { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import { useRecommendation } from "@/context/RecommendationContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function RecommendationsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const {
    recommendations,
    isLoading,
    fetchRecommendations,
    getTrendingProducts,
    getPersonalizedFeed,
  } = useRecommendation();
  const [activeTab, setActiveTab] = useState<"personalized" | "trending">(
    "personalized"
  );

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login?redirect=/recommendations");
      return;
    }
    loadRecommendations();
  }, [user, authLoading, router]);

  const loadRecommendations = async () => {
    try {
      await fetchRecommendations(user?.id || 1);
    } catch (error) {
      console.error("Failed to load recommendations:", error);
    }
  };

  if (isLoading) {
    return (
      <>
        <Head>
          <title>Recommendations | Moryella</title>
        </Head>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
            <p className="mt-4 text-gray-600">Loading recommendations...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const personalized = recommendations.personalized || [];
  const trending = recommendations.trending || [];

  return (
    <>
      <Head>
        <title>Recommendations | Moryella</title>
        <meta name="description" content="Personalized product recommendations" />
      </Head>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Recommended For You
            </h1>
            <p className="text-gray-600">
              Personalized products based on your interests and shopping history
            </p>
          </div>

          {/* Tabs */}
          <div className="mb-6 flex space-x-4 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("personalized")}
              className={`px-4 py-3 font-medium border-b-2 transition ${
                activeTab === "personalized"
                  ? "border-pink-600 text-pink-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              For You
            </button>
            <button
              onClick={() => setActiveTab("trending")}
              className={`px-4 py-3 font-medium border-b-2 transition ${
                activeTab === "trending"
                  ? "border-pink-600 text-pink-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Trending Now
            </button>
          </div>

          {/* Products Grid */}
          {activeTab === "personalized" ? (
            <div>
              {personalized.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 mb-4">
                    No personalized recommendations yet. Start exploring!
                  </p>
                  <Link href="/search">
                    <button className="bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700">
                      Browse Products
                    </button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {personalized.map((product) => (
                    <RecommendedProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              {trending.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">No trending products yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {trending.map((product) => (
                    <TrendingProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Info Section */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <InfoCard
              icon="🎯"
              title="Personalized"
              description="Our AI learns from your preferences to suggest products you'll love"
            />
            <InfoCard
              icon="🔥"
              title="Trending"
              description="Discover what's hot right now and what other customers are loving"
            />
            <InfoCard
              icon="💡"
              title="Smart"
              description="Get recommendations based on your browsing and purchase history"
            />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

interface Product {
  id: number;
  name: string;
  price: number;
  rating: number;
  category: string;
  image: string;
  discount?: number;
}

interface ProductCardProps {
  product: Product;
}

function RecommendedProductCard({ product }: ProductCardProps) {
  return (
    <Link href={`/product/${product.id}`}>
      <div className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden cursor-pointer group">
        {/* Image */}
        <div className="relative aspect-square bg-gray-200 overflow-hidden">
          <img
            src={product.image}
            alt={`${product.name} — Recommended Luxury Abaya | Modest Studio`}
            className="w-full h-full object-contain group-hover:scale-105 transition"
          />
          {product.discount && (
            <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-lg text-sm font-bold">
              -{product.discount}%
            </div>
          )}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition"></div>
        </div>

        {/* Info */}
        <div className="p-3">
          <p className="text-xs text-gray-500 mb-1">{product.category}</p>
          <h3 className="font-medium text-gray-900 text-sm mb-2 line-clamp-2">
            {product.name}
          </h3>
          <div className="flex items-center justify-between">
            <p className="font-bold text-gray-900">
              ₹{product.price.toLocaleString()}
            </p>
            <div className="flex items-center space-x-1">
              <span className="text-yellow-400">★</span>
              <span className="text-xs text-gray-600">{product.rating}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function TrendingProductCard({ product }: ProductCardProps) {
  return (
    <Link href={`/product/${product.id}`}>
      <div className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden cursor-pointer group">
        {/* Image with Trending Badge */}
        <div className="relative aspect-square bg-gray-200 overflow-hidden">
          <img
            src={product.image}
            alt={`${product.name} — Recommended Luxury Abaya | Modest Studio`}
            className="w-full h-full object-contain group-hover:scale-105 transition"
          />
          <div className="absolute top-2 left-2 bg-gradient-to-r from-pink-500 to-red-500 text-white px-2 py-1 rounded-lg text-xs font-bold flex items-center space-x-1">
            <span>🔥</span>
            <span>Trending</span>
          </div>
          {product.discount && (
            <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-lg text-sm font-bold">
              -{product.discount}%
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <p className="text-xs text-gray-500 mb-1">{product.category}</p>
          <h3 className="font-medium text-gray-900 text-sm mb-2 line-clamp-2">
            {product.name}
          </h3>
          <div className="flex items-center justify-between">
            <p className="font-bold text-gray-900">
              ₹{product.price.toLocaleString()}
            </p>
            <div className="flex items-center space-x-1">
              <span className="text-yellow-400">★</span>
              <span className="text-xs text-gray-600">{product.rating}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

interface InfoCardProps {
  icon: string;
  title: string;
  description: string;
}

function InfoCard({ icon, title, description }: InfoCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6 text-center">
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );
}
