import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/app/lib/auth/mongodb";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const normalizedEmail = email.toLowerCase();

    // Check for existing user
    const existingUser = await db
      .collection("users")
      .findOne({ email: normalizedEmail });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 12);
    await db.collection("users").insertOne({
      email: normalizedEmail,
      password: hashedPassword,
      createdAt: new Date(),
    });

    return NextResponse.json(
      { message: "Account created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
