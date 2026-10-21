import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";

const TAGS = new Set(["trips", "garage", "site"]);

function validSecret(given: string | null): boolean {
  const expected = process.env.REVALIDATE_SECRET ?? "";

  if (expected === "" || given === null) {
    return false;
  }

  const a = Buffer.from(given);
  const b = Buffer.from(expected);

  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Called by the backend's queued job after content changes: { "tags": ["trips", "site"] }.
 * Requires the shared secret in the `x-revalidate-secret` header.
 */
export async function POST(request: NextRequest) {
  if (!validSecret(request.headers.get("x-revalidate-secret"))) {
    return Response.json({ message: "Invalid secret" }, { status: 401 });
  }

  let tags: unknown;

  try {
    tags = ((await request.json()) as { tags?: unknown }).tags;
  } catch {
    return Response.json({ message: "Invalid JSON" }, { status: 400 });
  }

  if (!Array.isArray(tags) || tags.length === 0 || !tags.every((tag) => TAGS.has(tag))) {
    return Response.json({ message: "Unknown tags" }, { status: 422 });
  }

  // Expire immediately: the next visit waits for fresh data instead of seeing stale content.
  for (const tag of tags as string[]) {
    revalidateTag(tag, { expire: 0 });
  }

  return Response.json({ revalidated: tags, now: Date.now() });
}
