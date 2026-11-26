"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { submitReviewAction } from "@/actions/engagement";
import { cn } from "@/lib/utils";

export function ReviewForm({ productId, productSlug, signedIn }: { productId: string; productSlug: string; signedIn: boolean }) {
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string>();
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!signedIn) {
    return (
      <p className="rounded-2xl border border-dashed p-5 text-sm text-muted-foreground">
        Bought this product?{" "}
        <Link href={`/login?next=/product/${productSlug}`} className="font-semibold text-royal hover:underline">
          Sign in
        </Link>{" "}
        to write a review.
      </p>
    );
  }
  if (done) {
    return <p className="rounded-2xl bg-emerald-50 p-5 text-sm font-medium text-emerald-700">Thank you! Your review has been posted.</p>;
  }

  return (
    <form
      className="space-y-3 rounded-2xl border p-5"
      onSubmit={(e) => {
        e.preventDefault();
        setError(undefined);
        startTransition(async () => {
          const res = await submitReviewAction({ productId, rating, comment });
          if (res.ok) {
            setDone(true);
            toast.success("Review posted");
          } else {
            setError(res.fieldErrors?.comment?.[0] ?? res.error);
          }
        });
      }}
    >
      <h3 className="font-semibold text-navy">Write a review</h3>
      <div className="flex gap-1" role="radiogroup" aria-label="Rating" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={rating === i}
            aria-label={`${i} star${i > 1 ? "s" : ""}`}
            onMouseEnter={() => setHover(i)}
            onClick={() => setRating(i)}
          >
            <Star className={cn("size-6", i <= (hover || rating) ? "fill-yellow-brand text-yellow-brand" : "text-muted-foreground/40")} />
          </button>
        ))}
      </div>
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="How was the quality, delivery and value for money?"
        rows={4}
        maxLength={1500}
        aria-label="Your review"
        aria-invalid={!!error}
      />
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" disabled={pending || comment.trim().length < 5}>
        {pending ? "Posting…" : "Post review"}
      </Button>
    </form>
  );
}
