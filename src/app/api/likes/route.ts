import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth/auth";
import { getDb } from "@/app/lib/auth/mongodb";
import { Like } from "@/app/lib/definitions";

export async function GET() {
  try {
    const db = await getDb();
    
    // Get total like counts for all events
    const likeCounts = await db.collection("likes").aggregate([
      {
        $group: {
          _id: "$eventId",
          count: { $sum: 1 }
        }
      }
    ]).toArray();
    
    // Convert to a map of eventId -> count
    const likeCountMap: { [eventId: string]: number } = {};
    likeCounts.forEach((item: any) => {
      likeCountMap[item._id] = item.count;
    });

    const session = await auth();
    let likedEventIds: string[] = [];
    
    if (session?.user?.id) {
      // Get user's liked events
      const likes = await db.collection("likes").find({ userId: session.user.id }).toArray();
      likedEventIds = likes.map((like) => (like as unknown as Like).eventId);
    }

    return NextResponse.json({ 
      likedEventIds,
      likeCounts: likeCountMap
    });
  } catch (error) {
    console.error("Error fetching likes:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId }: { eventId: string } = await request.json();
    if (!eventId) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
    }

    const db = await getDb();
    const like: Like = {
      userId: session.user.id,
      eventId,
    };

    await db.collection("likes").createIndex({ userId: 1, eventId: 1 }, { unique: true });

    const result = await db.collection("likes").updateOne(
      { userId: like.userId, eventId: like.eventId },
      { $setOnInsert: like },
      { upsert: true }
    );

    if (result.upsertedCount === 0) {
      return NextResponse.json({ message: "Already liked" }, { status: 200 });
    }

    return NextResponse.json({ message: "Like added successfully" });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      return NextResponse.json({ message: "Already liked" }, { status: 200 });
    }
    console.error("Error adding like:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId }: { eventId: string } = await request.json();
    if (!eventId) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
    }

    const db = await getDb();
    const result = await db.collection("likes").deleteOne({
      userId: session.user.id,
      eventId,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ message: "Like not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Like removed successfully" });
  } catch (error) {
    console.error("Error removing like:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}