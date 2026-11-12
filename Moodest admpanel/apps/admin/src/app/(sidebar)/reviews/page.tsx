"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Search, Star } from "@/components/ui/icon";
import { API_URL } from "@/lib/api-client";

interface Review {
  id: string;
  productName: string;
  productImage: string;
  userName: string;
  rating: number;
  comment: string;
  status: string;
  createdAt: string;
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={
            "h-4 w-4 " +
            (n <= rating
              ? "fill-amber-400 text-amber-400"
              : "text-gray-300 dark:text-gray-600")
          }
        />
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        // Fetch products via same-origin proxy
        const productsRes = await fetch(`/api/products?limit=20`).catch(() =>
          fetch(`${API_URL}/products?limit=20`)
        );
        if (!productsRes.ok) {
          setReviews([]);
          setLoading(false);
          return;
        }
        const productsData = await productsRes.json() as { data?: Array<{ id: number; name: string; images?: string[] }> } | Array<{ id: number; name: string; images?: string[] }>;
        const products = Array.isArray(productsData) ? productsData : (productsData.data ?? []);

        // Fetch reviews for the first 5 products in parallel
        interface RawReviewItem {
          id: number;
          rating: number;
          title?: string;
          body?: string;
          createdAt: string;
          user?: { firstName?: string; lastName?: string; email?: string };
        }

        const reviewPromises = products.slice(0, 5).map(async (p) => {
          const r = await fetch(`/api/reviews/product/${p.id}?limit=20`).catch(() =>
            fetch(`${API_URL}/reviews/product/${p.id}?limit=20`)
          ).catch(() => null);
          if (!r?.ok) return [];
          const rd = await r.json() as { reviews?: RawReviewItem[]; data?: RawReviewItem[] } | RawReviewItem[];
          const items: RawReviewItem[] = Array.isArray(rd)
            ? rd
            : (rd.reviews ?? rd.data ?? []);
          return items.map((rev: RawReviewItem) => ({
            id: String(rev.id),
            productName: p.name,
            productImage: (p.images ?? [])[0] ?? "",
            userName: rev.user
              ? `${rev.user.firstName ?? ""} ${rev.user.lastName ?? ""}`.trim() || (rev.user.email ?? "Customer")
              : "Customer",
            rating: rev.rating,
            comment: rev.body ?? rev.title ?? "",
            status: "approved",
            createdAt: rev.createdAt,
          }));
        });

        const allReviews = (await Promise.all(reviewPromises)).flat();
        setReviews(allReviews);
      } catch (err) {
        console.warn("Could not fetch reviews from backend:", err);
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = reviews.filter(
    (r) =>
      r.productName.toLowerCase().includes(search.toLowerCase()) ||
      r.userName.toLowerCase().includes(search.toLowerCase()) ||
      r.comment.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Reviews</h1>
            <p className="text-muted-foreground">
              Product feedback submitted by customers
            </p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>All Reviews</CardTitle>
                  <CardDescription>
                    {filtered.length} of {reviews.length} reviews
                  </CardDescription>
                </div>
                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search reviews"
                    className="pl-8"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-24 text-muted-foreground">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Loading reviews...
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Review</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Image
                              src={r.productImage}
                              alt={r.productName}
                              width={40}
                              height={40}
                              className="h-10 w-10 rounded-md object-cover"
                            />
                            <span className="text-sm font-medium">
                              {r.productName}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Stars rating={r.rating} />
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <p className="truncate text-sm text-muted-foreground">
                            {r.comment}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(r.createdAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {r.userName}
                        </TableCell>
                        <TableCell>
                          {r.status === "approved" ? (
                            <Badge className="bg-green-600 hover:bg-green-700 text-white">
                              Approved
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {filtered.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="h-24 text-center text-muted-foreground"
                        >
                          No reviews found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
