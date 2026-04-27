import { NextResponse } from "next/server";
import { auth } from "@/app/lib/auth/auth";
import { getDb } from "@/app/lib/auth/mongodb";
import { Like } from "@/app/lib/definitions";

export interface rankedEvent {
  event: any;
  cos_sim: number;
  overlap: number;
  repetition: number;
  final_score: number;
}

// Global cache for suggested recommendations
const suggestedCache = new Map<string, any>();

/**
 * GET /api/recommendations/suggested
 *
 * Returns personalized event suggestions for the logged-in user.
 * Uses cosine similarity between the user's average liked-event embedding
 * and all future event embeddings to rank recommendations.
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
    if (suggestedCache.has(cacheKey)) {
      return NextResponse.json({ events: suggestedCache.get(cacheKey) });
    }

    // 2. Fetch all events
    const allEvents = await db.collection("events").find({}).toArray();

    // Build a set of liked event _id strings for fast lookup
    const likedEventSet = new Set(likedEventIds);

    // Identify the liked events from the full event list by matching _id
    const likedEvents = allEvents.filter((event: any) => {
      return likedEventSet.has(event._id.toString());
    });

    // 3. Collect embeddings from liked events (filter out any without embeddings)
    const likedEmbeddings: number[][] = likedEvents
      .map((e: any) => e.embedding)
      .filter((emb: any): emb is number[] => Array.isArray(emb) && emb.length > 0);

    // 4. Score future events using cosine similarity to average liked embedding
    const now = new Date().toISOString();
    let scored: rankedEvent[] = [];

    if (likedEmbeddings.length > 0) {
      // Compute average embedding element-wise across all liked events
      const dim = likedEmbeddings[0].length;
      const avgEmbedding = new Array<number>(dim).fill(0);
      for (const emb of likedEmbeddings) {
        for (let i = 0; i < dim; i++) {
          avgEmbedding[i] += emb[i];
        }
      }
      for (let i = 0; i < dim; i++) {
        avgEmbedding[i] /= likedEmbeddings.length;
      }

      // Build fingerprints of liked events to exclude recurring matches
      // (those are already surfaced by the /recurring endpoint)
      const likedFingerprints = new Set(
        likedEvents.map((e: any) => {
          const orgName = e.organizer?.name || "";
          return `${e.name}|||${orgName}`;
        })
      );

      // Filter to future events not already liked, with valid embeddings,
      // and NOT a recurring instance of a liked event
      const candidates = allEvents.filter((event: any) => {
        const eventIdStr = event._id.toString();
        if (likedEventSet.has(eventIdStr)) return false;
        if (event.startDate < now) return false;
        if (!Array.isArray(event.embedding) || event.embedding.length === 0) return false;

        // Exclude recurring events (same name + organizer as a liked event)
        const orgName = event.organizer?.name || "";
        const fingerprint = `${event.name}|||${orgName}`;
        if (likedFingerprints.has(fingerprint)) return false;

        return true;
      });

      // Score each candidate (await async overlapPercentage)
      for (const event of candidates) {
        const semanticScore = cosineSimilarity(avgEmbedding, event.embedding);
        const olScore = await overlapPercentage(db, likedEvents, event);
        const repScore = repetitionScore(likedEvents, event);
        const finalScore = semanticScore + olScore + repScore;
        scored.push({
          event,
          cos_sim: semanticScore,
          overlap: olScore,
          repetition: repScore,
          final_score: finalScore,
        });
      }

      scored.sort((a, b) => b.final_score - a.final_score);
      scored = scored.slice(0, 10);
    }

    // Strip embedding arrays before sending to client
    const results = scored.map((item) => {
      const { embedding, ...rest } = item.event;
      return { ...rest, _id: item.event._id.toString() };
    });
    const serialized = JSON.parse(JSON.stringify(results));

    suggestedCache.set(cacheKey, serialized);
    return NextResponse.json({ events: serialized });
  } catch (error) {
    console.error("Error fetching suggested recommendations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/** Cosine similarity between two vectors. Returns value in [-1, 1]. */
function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  if (denom == 0)
    return 0;
  return dot / denom;
}

async function overlapPercentage(db: any, likedEvents: any[], targetEvent: any): Promise<number> {
  // Find all users who liked the target event (by its _id)
  const targetEventId = targetEvent._id.toString();
  const allLikes = await db.collection("likes").find({ eventId: targetEventId }).toArray();
  if (allLikes.length == 0 || likedEvents.length == 0)
    return 0;

  // Build a set of liked event _ids for fast lookup
  const likedEventIdSet = new Set(likedEvents.map((e: any) => e._id.toString()));

  let overlap = 0;
  for (const like of allLikes) {
    const likesOfUser = await db.collection("likes").find({ userId: like.userId }).toArray();
    for (const likeOfUser of likesOfUser) {
      if (likedEventIdSet.has(likeOfUser.eventId)) {
        overlap++;
      }
    }
  }

  return overlap / likedEvents.length;
}

function repetitionScore(likedEvents: any[], targetEvent: any) {
  let organizerReptition = 0;
  let categoryReptition = 0;
  let dayReptition = 0;
  let weekendReptition = 0;
  let timeReptition = 0;

  for (const likedEvent of likedEvents) {
    if (likedEvent.organizer?.name && targetEvent.organizer?.name && likedEvent.organizer.name === targetEvent.organizer.name) {
      organizerReptition++;
    }
    if (likedEvent.category && targetEvent.category && likedEvent.category === targetEvent.category) {
      categoryReptition++;
    }
    if (new Date(likedEvent.startDate).getDay() === new Date(targetEvent.startDate).getDay()) {
      dayReptition++;
    }
    if (new Date(likedEvent.startDate).getDay() >= 5 && new Date(likedEvent.startDate).getDay() <= 6 && new Date(targetEvent.startDate).getDay() >= 5 && new Date(targetEvent.startDate).getDay() <= 6) {
      weekendReptition++;
    }
    if (new Date(likedEvent.startDate).getHours() >= 0 && new Date(likedEvent.startDate).getHours() <= 12 && new Date(targetEvent.startDate).getHours() >= 0 && new Date(targetEvent.startDate).getHours() <= 12) {
      timeReptition++;
    } else if (new Date(likedEvent.startDate).getHours() >= 12 && new Date(likedEvent.startDate).getHours() <= 17 && new Date(targetEvent.startDate).getHours() >= 12 && new Date(targetEvent.startDate).getHours() <= 17) {
      timeReptition++;
    } else if (new Date(likedEvent.startDate).getHours() >= 17 && new Date(likedEvent.startDate).getHours() <= 23 && new Date(targetEvent.startDate).getHours() >= 17 && new Date(targetEvent.startDate).getHours() <= 23) {
      timeReptition++;
    }
  }

  return Math.max(organizerReptition, categoryReptition, dayReptition, timeReptition, weekendReptition) / (likedEvents.length);
}