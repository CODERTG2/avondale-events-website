import { NextResponse } from "next/server";
import { auth } from "@/app/lib/auth/auth";
import { getDb } from "@/app/lib/auth/mongodb";
import { Like } from "@/app/lib/definitions";

/**
 * GET /api/recommendations/suggested
 *
 * Returns personalized event suggestions for the logged-in user.
 *
 * ── HOW TO UPDATE THE BACKEND LOGIC ──
 * Edit this file: src/app/api/recommendations/suggested/route.ts
 *
 * CURRENT IMPLEMENTATION: placeholder — returns same-organizer events.
 * FUTURE: Replace the scoring logic below with embeddings / cosine similarity.
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

    // 2. Fetch all events
    const allEvents = await db.collection("events").find({}).toArray();

    // Build a set of liked event identifiers for fast lookup
    const likedEventSet = new Set(likedEventIds);

    // Identify the liked events from the full event list
    const likedEvents = allEvents.filter((event: any) => {
      const eventId = event.url
        ? `${event.url}|${event.startDate}`
        : `${event.name}|${event.startDate}`;
      return likedEventSet.has(eventId);
    });

    // 3. Collect organizer names and event names from liked events
    const likedOrgNames = new Set(
      likedEvents
        .map((e: any) => e.organizer?.name)
        .filter(Boolean)
    );
    const likedEventNames = new Set(
      likedEvents.map((e: any) => e.name)
    );

    // 4. Score future events
    //    ── THIS IS THE SECTION TO REPLACE WITH AI / EMBEDDINGS ──
    const now = new Date().toISOString();
    const scored = allEvents
      .filter((event: any) => {
        const eventId = event.url
          ? `${event.url}|${event.startDate}`
          : `${event.name}|${event.startDate}`;
        // Skip already-liked and past events
        return !likedEventSet.has(eventId) && event.startDate >= now;
      })
      .map((event: any) => {
        let score = 0;

        // Same organizer → strong signal
        if (event.organizer?.name && likedOrgNames.has(event.organizer.name)) {
          score += 2;
        }

        // Same event name (recurring) → also a signal but lower since
        // the recurring endpoint already handles exact matches
        if (likedEventNames.has(event.name)) {
          score += 1;
        }

        return { event, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10) // Top 10 suggestions
      .map((item) => item.event);

    // Serialize for JSON
    const serialized = JSON.parse(JSON.stringify(scored));

    return NextResponse.json({ events: serialized });
  } catch (error) {
    console.error("Error fetching suggested recommendations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
