// Customer reviews. Empty for now — drop entries in here and the Reviews tab
// (and anything else reading this file) picks them up automatically.

export interface Review {
  id: string;
  name: string;
  rating: number; // 1–5
  product: string;
  body: string;
  date: string; // ISO date
  photo?: string; // optional customer photo, e.g. /assets/images/reviews/ana.jpg
}

export const reviews: Review[] = [];

// Aggregate for the review wall (cart page). Rounded average, empty stays 0.
export const reviewSummary = () => {
  const count = reviews.length;
  return {
    count,
    stars: count ? Math.round(reviews.reduce((sum, r) => sum + r.rating, 0) / count) : 0,
    photoReviews: reviews.filter((r) => r.photo),
  };
};
