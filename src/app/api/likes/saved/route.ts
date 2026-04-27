import { NextResponse } from "next/server";
import { auth } from "@/app/lib/auth/auth";
import { getDb } from "@/app/lib/auth/mongodb";
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();

    // Get all event IDs liked by this user
    const likes = await db
      .collection("likes")
      .find({ userId: session.user.id })
      .toArray();

    const likedEventIds = likes.map((like) => like.eventId.toString());

    if (likedEventIds.length === 0) {
      return NextResponse.json({ events: [] });
    }

    // Convert string IDs to ObjectIds for direct MongoDB lookup
    const objectIds = likedEventIds
      .filter((id) => ObjectId.isValid(id))
      .map((id) => new ObjectId(id));

    // Fetch matching events directly by _id
    const matchedEvents = await db
      .collection("events")
      .find({ _id: { $in: objectIds } })
      .toArray();

    // Serialize (convert ObjectId to string, strip embedding)
    const serialized = matchedEvents.map((event) => {
      const { embedding, ...rest } = event;
      return { ...rest, _id: event._id.toString() };
    });

    return NextResponse.json({ events: serialized });
  } catch (error) {
    console.error("Error fetching saved events:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
