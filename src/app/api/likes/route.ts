import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth/auth";
import { getDb } from "@/app/lib/auth/mongodb";
import { Like } from "@/app/lib/definitions";

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

    // Check if like already exists
    const existingLike = await db.collection("likes").findOne(like);
    if (existingLike) {
      return NextResponse.json({ message: "Already liked" }, { status: 200 });
    }

    // Insert the like
    await db.collection("likes").insertOne(like);

    return NextResponse.json({ message: "Like added successfully" });
  } catch (error) {
    console.error("Error adding like:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}