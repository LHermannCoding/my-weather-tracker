import { auth } from "@clerk/nextjs/server";
import { createServiceClient } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// POST /api/cities — add a custom city
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, country, latitude, longitude } = await req.json();

  if (!name || !country || latitude == null || longitude == null) {
    return NextResponse.json(
      { error: "name, country, latitude, and longitude are required" },
      { status: 400 }
    );
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return NextResponse.json(
      { error: "Invalid coordinates" },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  // Check if city already exists at similar coordinates
  const { data: existing } = await supabase
    .from("cities")
    .select("id")
    .ilike("name", name)
    .limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json(
      { error: "City already exists", city_id: existing[0].id },
      { status: 409 }
    );
  }

  const { data, error } = await supabase
    .from("cities")
    .insert({ name, country, latitude, longitude })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Auto-favorite the city for the user who added it
  await supabase
    .from("user_favorites")
    .insert({ user_id: userId, city_id: data.id });

  return NextResponse.json({ city_id: data.id }, { status: 201 });
}
