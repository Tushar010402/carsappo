import "server-only";

export type InstagramPost = {
  id: string;
  caption: string;
  mediaType: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  imageUrl: string;
  permalink: string;
};

/**
 * Latest Instagram posts & reels via the Instagram API (Instagram Login).
 * Set INSTAGRAM_ACCESS_TOKEN to a long-lived token for the Carsappo business account.
 * Cached for an hour. Returns [] when not configured so the UI can show a fallback.
 */
export async function getInstagramPosts(limit = 8): Promise<InstagramPost[]> {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!token) return [];
  try {
    const url = new URL("https://graph.instagram.com/me/media");
    url.searchParams.set("fields", "id,caption,media_type,media_url,thumbnail_url,permalink");
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("access_token", token);
    const res = await fetch(url, { next: { revalidate: 3600, tags: ["instagram"] } });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      data?: { id: string; caption?: string; media_type: InstagramPost["mediaType"]; media_url?: string; thumbnail_url?: string; permalink: string }[];
    };
    return (data.data ?? [])
      .map((m) => ({
        id: m.id,
        caption: m.caption ?? "",
        mediaType: m.media_type,
        imageUrl: (m.media_type === "VIDEO" ? m.thumbnail_url : m.media_url) ?? "",
        permalink: m.permalink,
      }))
      .filter((m) => m.imageUrl);
  } catch {
    return [];
  }
}

export type GoogleReview = { author: string; rating: number; text: string; relativeTime: string; photo?: string };

/**
 * Google reviews via Places API (New). Requires GOOGLE_PLACES_API_KEY and GOOGLE_PLACE_ID.
 * Falls back to admin-managed "Google" testimonials when not configured.
 */
export async function getGoogleReviews(): Promise<{ rating: number; total: number; reviews: GoogleReview[] } | null> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;
  if (!key || !placeId) return null;
  try {
    const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
      headers: { "X-Goog-Api-Key": key, "X-Goog-FieldMask": "rating,userRatingCount,reviews" },
      next: { revalidate: 21600, tags: ["google-reviews"] },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      rating?: number;
      userRatingCount?: number;
      reviews?: {
        rating: number;
        text?: { text: string };
        relativePublishTimeDescription?: string;
        authorAttribution?: { displayName?: string; photoUri?: string };
      }[];
    };
    return {
      rating: data.rating ?? 0,
      total: data.userRatingCount ?? 0,
      reviews: (data.reviews ?? [])
        .filter((r) => r.text?.text)
        .map((r) => ({
          author: r.authorAttribution?.displayName ?? "Google user",
          rating: r.rating,
          text: r.text!.text,
          relativeTime: r.relativePublishTimeDescription ?? "",
          photo: r.authorAttribution?.photoUri,
        })),
    };
  } catch {
    return null;
  }
}
