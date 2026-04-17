import { auth } from "@clerk/nextjs/server";
import { createServiceClient } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/favorites — list user's favorite city IDs
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("user_favorites")
    .select("city_id")
    .eq("user_id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data.map((f) => f.city_id));
}

// POST /api/favorites — add a city to favorites
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { city_id } = await req.json();
  if (!city_id) return NextResponse.json({ error: "city_id required" }, { status: 400 });

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("user_favorites")
    .insert({ user_id: userId, city_id });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ message: "Already a favorite" }, { status: 200 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}

// DELETE /api/favorites — remove a city from favorites
export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { city_id } = await req.json();
  if (!city_id) return NextResponse.json({ error: "city_id required" }, { status: 400 });

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("user_favorites")
    .delete()
    .eq("user_id", userId)
    .eq("city_id", city_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
