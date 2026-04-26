import { NextResponse } from "next/server";
import { auth } from "@/app/lib/auth/auth";
import { getDb } from "@/app/lib/auth/mongodb";
import { Like } from "@/app/lib/definitions";

/**
 * GET /api/recommendations/recurring
 *
 * Returns future events that have the EXACT same name and organizer
 * as events the logged-in user has liked. This surfaces recurring
 * instances of events the user already enjoys.
 *
 * ── HOW TO UPDATE THE BACKEND LOGIC ──
 * Edit this file: src/app/api/recommendations/recurring/route.ts
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ events: [] });
    }

    const db = await getDb();

    // 1. Fetch the user's liked event IDs
    const likes = await db
      .collection("likes")
      .find({ userId: session.user.id })
      .toArray();
    const likedEventIds = likes.map((like) => (like as unknown as Like).eventId);

    if (likedEventIds.length === 0) {
      return NextResponse.json({ events: [] });
    }

    // 2. Fetch the full event docs for the liked events to get name + organizer
    const allEvents = await db.collection("events").find({}).toArray();

    // Build a set of liked event identifiers for fast lookup
    // eventId format is either "url|startDate" or "name|startDate"
    const likedEventSet = new Set(likedEventIds);

    // Identify the liked events from the full event list
    const likedEvents = allEvents.filter((event: any) => {
      const eventId = event.url
        ? `${event.url}|${event.startDate}`
        : `${event.name}|${event.startDate}`;
      return likedEventSet.has(eventId);
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
      const eventId = event.url
        ? `${event.url}|${event.startDate}`
        : `${event.name}|${event.startDate}`;

      // Skip events the user has already liked
      if (likedEventSet.has(eventId)) return false;

      // Must be in the future
      if (event.startDate < now) return false;

      // Must match name+organizer of a liked event
      const orgName = event.organizer?.name || "";
      const fingerprint = `${event.name}|||${orgName}`;
      return likedFingerprints.has(fingerprint);
    });

    // Serialize for JSON
    const serialized = JSON.parse(JSON.stringify(recurringEvents));

    return NextResponse.json({ events: serialized });
  } catch (error) {
    console.error("Error fetching recurring recommendations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
