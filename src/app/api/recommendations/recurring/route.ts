import { NextResponse } from "next/server";
import { auth } from "@/app/lib/auth/auth";
import { getDb } from "@/app/lib/auth/mongodb";
import { Like } from "@/app/lib/definitions";
import { ObjectId } from "mongodb";

// Global cache to prevent re-evaluating recommendations unnecessarily
const recurringCache = new Map<string, any>();

/**
 * GET /api/recommendations/recurring
 *
 * Returns future events that have the EXACT same name and organizer
 * as events the logged-in user has liked. This surfaces recurring
 * instances of events the user already enjoys.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ events: [] });
    }

    const db = await getDb();

    // 1. Fetch the user's liked event IDs (now MongoDB _id strings)
    const likes = await db
      .collection("likes")
      .find({ userId: session.user.id })
      .toArray();
    const likedEventIds = likes.map((like) => like.eventId.toString());

    if (likedEventIds.length === 0) {
      return NextResponse.json({ events: [] });
    }

    // Check Cache
    const cacheKey = `${session.user.id}_${likedEventIds.sort().join(",")}`;
    if (recurringCache.has(cacheKey)) {
      return NextResponse.json({ events: recurringCache.get(cacheKey) });
    }

    // 2. Fetch all events
    const allEvents = await db.collection("events").find({}).toArray();

    // Build a set of liked event _id strings for fast lookup
    const likedEventSet = new Set(likedEventIds);

    // Identify the liked events from the full event list by matching _id
    const likedEvents = allEvents.filter((event: any) => {
      return likedEventSet.has(event._id.toString());
    });

    // 3. Build fingerprints from liked events: "name|organizer"
    const likedFingerprints = new Set(
      likedEvents.map((e: any) => {
        const orgName = e.organizer?.name || "";
        return `${e.name}|||${orgName}`;
      })
    );

    // 4. Find future events that match name+organizer but are NOT the same instance
    const now = new Date().toISOString();
    const recurringEvents = allEvents.filter((event: any) => {
      const eventIdStr = event._id.toString();

      // Skip events the user has already liked
      if (likedEventSet.has(eventIdStr)) return false;

      // Must be in the future
      if (event.startDate < now) return false;

      // Must match name+organizer of a liked event
      const orgName = event.organizer?.name || "";
      const fingerprint = `${event.name}|||${orgName}`;
      return likedFingerprints.has(fingerprint);
    });

    // Serialize for JSON (convert ObjectId to string)
    const serialized = recurringEvents.map((event: any) => {
      const { embedding, ...rest } = event;
      return { ...rest, _id: event._id.toString() };
    });

    recurringCache.set(cacheKey, serialized);
    return NextResponse.json({ events: serialized });
  } catch (error) {
    console.error("Error fetching recurring recommendations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
