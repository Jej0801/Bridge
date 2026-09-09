/**
 * Client for submitting a link shared into Bridge (from the IG/TikTok
 * share sheet) to the backend, which enriches it via oEmbed and stores
 * it. Mirrors the shape of reviewService.ts for consistency.
 */

const REVIEW_SERVICE_URL =
  process.env.EXPO_PUBLIC_REVIEW_SERVICE_URL ?? "http://localhost:8000";

export type SourcePlatform = "instagram" | "tiktok" | "unknown";
export type ShareStatus = "pending" | "enriched" | "failed";

export interface SharedContent {
  id: string;
  user_id: string;
  original_url: string;
  platform: SourcePlatform;
  status: ShareStatus;
  title: string | null;
  author_name: string | null;
  thumbnail_url: string | null;
  embed_html: string | null;
  error_message: string | null;
  created_at: string;
  enriched_at: string | null;
}

class ShareServiceError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "ShareServiceError";
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${REVIEW_SERVICE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ShareServiceError(`Share service request failed (${res.status}): ${body}`, res.status);
  }
  return res.json() as Promise<T>;
}

/** Submits a freshly-received share-intent URL for enrichment. */
export function submitSharedLink(userId: string, url: string): Promise<SharedContent> {
  return request<SharedContent>("/share", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, url }),
  });
}

export function getSharedContent(id: string): Promise<SharedContent> {
  return request<SharedContent>(`/share/${id}`);
}

export function listSharedContent(userId: string): Promise<SharedContent[]> {
  return request<SharedContent[]>(`/share?user_id=${userId}`);
}

/** Polls until oEmbed enrichment finishes (or times out), since it runs as a background task. */
export async function waitForEnrichment(
  id: string,
  { intervalMs = 1500, timeoutMs = 20_000 }: { intervalMs?: number; timeoutMs?: number } = {}
): Promise<SharedContent> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const item = await getSharedContent(id);
    if (item.status === "enriched" || item.status === "failed") return item;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new ShareServiceError(`Shared content ${id} did not finish enriching within ${timeoutMs}ms`);
}
