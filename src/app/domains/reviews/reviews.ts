export interface Review {
  id: string;
  placeId: string;
  userId: string;
  displayName: string;
  rating: number;
  comment: string;
  createdAt: string;
  photo?: string;
}
export function validReview(rating: number, comment: string): boolean {
  return (
    Number.isInteger(rating) &&
    rating >= 1 &&
    rating <= 5 &&
    comment.trim().length >= 10 &&
    comment.trim().length <= 1000
  );
}
export function ratingSummary(reviews: Review[]): {
  ratingAverage: number | null;
  reviewCount: number;
} {
  return {
    ratingAverage: reviews.length
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : null,
    reviewCount: reviews.length,
  };
}
export function validPhoto(file: File): string {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
    return 'Elige una fotografía JPG, PNG o WebP.';
  if (file.size > 5 * 1024 * 1024) return 'La fotografía debe pesar como máximo 5 MB.';
  return '';
}
