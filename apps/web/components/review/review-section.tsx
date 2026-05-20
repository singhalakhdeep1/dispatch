"use client";

import { useState } from "react";
import { Star, ThumbsUp, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useReviews, useCreateReview } from "@/lib/api/cart";
import { useSession } from "next-auth/react";

interface Props {
    restaurantId: string;
}

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
                <button
                    key={s}
                    type="button"
                    onClick={() => onChange?.(s)}
                    className={onChange ? "cursor-pointer" : "cursor-default"}
                >
                    <Star
                        className={`h-5 w-5 ${s <= value ? "fill-yellow-400 text-yellow-400" : "text-zinc-300 dark:text-zinc-600"}`}
                    />
                </button>
            ))}
        </div>
    );
}

export function ReviewSection({ restaurantId }: Props) {
    const { data: session } = useSession();
    const { data: reviews, isLoading } = useReviews(restaurantId);
    const createReview = useCreateReview();
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [submitted, setSubmitted] = useState(false);

    const allReviews: any[] = reviews?.data ?? reviews ?? [];

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!comment.trim()) return;
        await createReview.mutateAsync({
            targetType: "RESTAURANT",
            targetId: restaurantId,
            orderId: "", // user must select an order — simplified for now
            rating,
            comment,
        });
        setComment("");
        setRating(5);
        setSubmitted(true);
    }

    return (
        <div className="space-y-6">
            {/* Write a review */}
            {session && !submitted && (
                <div className="rounded-xl border dark:border-zinc-800 p-5">
                    <h3 className="font-semibold mb-3">Write a Review</h3>
                    <form onSubmit={handleSubmit} className="space-y-3">
                        <div>
                            <label className="text-sm text-zinc-500 mb-1 block">Your rating</label>
                            <StarRating value={rating} onChange={setRating} />
                        </div>
                        <Textarea
                            placeholder="Share your experience..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={3}
                            className="resize-none"
                        />
                        <Button
                            type="submit"
                            disabled={createReview.isPending || !comment.trim()}
                            className="bg-orange-500 hover:bg-orange-600 text-white"
                        >
                            {createReview.isPending ? "Submitting..." : "Submit Review"}
                        </Button>
                    </form>
                </div>
            )}

            {submitted && (
                <div className="rounded-xl border border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800 p-4 text-green-700 dark:text-green-300 text-sm font-medium">
                    ✓ Thank you for your review!
                </div>
            )}

            {/* Reviews list */}
            {isLoading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-24 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                    ))}
                </div>
            ) : allReviews.length === 0 ? (
                <div className="text-center py-12 text-zinc-400">
                    <Star className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No reviews yet. Be the first!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {allReviews.map((review: any) => (
                        <div key={review.id} className="rounded-xl border dark:border-zinc-800 p-4 bg-white dark:bg-zinc-900">
                            <div className="flex items-start gap-3">
                                <div className="h-9 w-9 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center flex-shrink-0">
                                    {review.user?.avatarUrl
                                        ? <img src={review.user.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
                                        : <User className="h-4 w-4 text-zinc-400" />
                                    }
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="font-medium text-sm">{review.user?.name ?? "Anonymous"}</span>
                                        <span className="text-xs text-zinc-400">{new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                                    </div>
                                    <StarRating value={review.rating} />
                                    {review.comment && (
                                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1.5">{review.comment}</p>
                                    )}
                                    {review.ownerReply && (
                                        <div className="mt-3 pl-3 border-l-2 border-orange-300 dark:border-orange-700">
                                            <p className="text-xs font-semibold text-orange-600 mb-0.5">Owner replied:</p>
                                            <p className="text-xs text-zinc-500">{review.ownerReply}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
