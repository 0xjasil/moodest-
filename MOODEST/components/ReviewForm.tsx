import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { reviewAPI } from "@/lib/api";

interface ReviewFormProps {
  productId: number;
  productName: string;
  onSuccess?: () => void;
}

export default function ReviewForm({ productId, productName, onSuccess }: ReviewFormProps) {
  const { isAuthenticated } = useAuth();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="bg-[#F4F4F4] border border-[#CDD3D8] rounded-lg p-6 text-center">
        <h4 className="text-base font-semibold text-[#000000] mb-2">Want to review this product?</h4>
        <p className="text-xs text-[#595E63] mb-4">
          Please sign in to share your verified review and rating with other shoppers.
        </p>
        <Link
          href="/login"
          className="inline-block px-5 py-2 text-xs font-semibold text-white bg-[#E80071] rounded-md hover:opacity-90 transition-opacity"
        >
          Sign In to Review
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage("Review title is required");
      return;
    }
    if (!comment.trim()) {
      setErrorMessage("Review comment is required");
      return;
    }

    setIsSubmitting(true);
    try {
      await reviewAPI.create(productId, {
        rating,
        title: title.trim(),
        body: comment.trim(),
      });
      setSubmitted(true);
      setRating(5);
      setTitle("");
      setComment("");

      setTimeout(() => {
        setSubmitted(false);
        onSuccess?.();
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to submit review. You may have already reviewed this product.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
        <p className="text-sm font-medium text-green-800">✓ Thank you for your review!</p>
        <p className="text-xs text-green-700 mt-1">Your feedback helps fellow shoppers discover luxury essentials.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-[#F4F4F4] border border-[#CDD3D8] rounded-lg p-6">
      <h3 className="text-base font-semibold text-[#000000]">Write a Review for {productName}</h3>

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-xs text-red-700">{errorMessage}</p>
        </div>
      )}

      {/* Rating */}
      <div>
        <label className="block text-xs font-semibold text-[#000000] mb-1.5 uppercase tracking-wide">
          Overall Rating
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className={`text-2xl transition-transform hover:scale-110 ${
                star <= rating ? "text-[#E80071]" : "text-[#CDD3D8]"
              }`}
            >
              ★
            </button>
          ))}
          <span className="text-xs font-medium text-[#595E63] self-center ml-2">
            {rating} of 5 Stars
          </span>
        </div>
      </div>

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-xs font-semibold text-[#000000] mb-1 uppercase tracking-wide">
          Review Headline <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Exquisite finish, lasting hydration"
          maxLength={100}
          className="w-full px-3 py-2 border border-[#CDD3D8] rounded-md bg-white text-xs text-[#000000] placeholder-[#595E63] focus:border-[#E80071] focus:outline-none focus:ring-1 focus:ring-[#E80071]"
        />
      </div>

      {/* Comment */}
      <div>
        <label htmlFor="comment" className="block text-xs font-semibold text-[#000000] mb-1 uppercase tracking-wide">
          Your Experience <span className="text-red-500">*</span>
        </label>
        <textarea
          id="comment"
          required
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your thoughts on texture, scent, packaging and results..."
          maxLength={500}
          rows={3}
          className="w-full px-3 py-2 border border-[#CDD3D8] rounded-md bg-white text-xs text-[#000000] placeholder-[#595E63] focus:border-[#E80071] focus:outline-none focus:ring-1 focus:ring-[#E80071] resize-none"
        />
        <p className="text-[10px] text-[#595E63] mt-1">{comment.length}/500 characters</p>
      </div>

      {/* Submit */}
      <div className="pt-1">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 bg-[#E80071] text-white text-xs font-semibold rounded-md hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {isSubmitting ? "Submitting Review..." : "Submit Review"}
        </button>
      </div>
    </form>
  );
}
