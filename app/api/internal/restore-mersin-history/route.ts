import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const token = process.env.LIDERIM_TELEGRAM_BOT_TOKEN;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!token || !url || !key || request.headers.get("authorization") !== `Bearer ${token}`) {
    return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  }

  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: existing, error: existingError } = await supabase
    .from("city_applications")
    .select("id")
    .eq("city_plate", "33")
    .eq("title", "Mersin Manşet")
    .eq("status", "historical")
    .maybeSingle();
  if (existingError) return NextResponse.json({ error: existingError.message }, { status: 500 });
  if (existing) return NextResponse.json({ restored: false, reason: "already_exists" });

  const { data: owner, error: ownerError } = await supabase
    .from("city_applications")
    .select("visitor_id")
    .eq("city_plate", "33")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (ownerError || !owner) return NextResponse.json({ error: ownerError?.message ?? "Başvuru bulunamadı" }, { status: 500 });

  const { error: insertError } = await supabase.from("city_applications").insert({
    visitor_id: owner.visitor_id,
    city_plate: "33",
    title: "Mersin Manşet",
    url: "https://www.instagram.com/mersin.manset",
    logo_url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTB12GdJPtTrnkjbSalUXChgc_V6I4oqTYVSktpsvPzag&s=10",
    offered_stars: 0,
    status: "historical",
  });
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
  return NextResponse.json({ restored: true });
}
