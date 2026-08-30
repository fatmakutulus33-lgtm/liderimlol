import { createClient } from "@supabase/supabase-js";
import { initialCities } from "../../data/cities";

export const dynamic = "force-dynamic";

type Leader = { city_plate: string; title: string; url: string; logo_url: string | null; price: number };
const isPlate = (value: unknown): value is string => typeof value === "string" && /^\d{2}$/.test(value);
const isUuid = (value: unknown): value is string => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

function database() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Supabase bağlantısı yapılandırılmamış.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function state(visitorId?: string) {
  const supabase = database();
  const [{ data: voteRows, error: voteError }, { data: leaderRows, error: leaderError }, visitorVote] = await Promise.all([
    supabase.from("city_votes").select("city_plate"),
    supabase.from("city_leaders").select("city_plate,title,url,logo_url,price"),
    visitorId ? supabase.from("city_votes").select("city_plate").eq("visitor_id", visitorId).maybeSingle() : Promise.resolve({ data: null, error: null }),
  ]);
  if (voteError || leaderError || visitorVote.error) throw voteError ?? leaderError ?? visitorVote.error;
  const counts = new Map<string, number>();
  voteRows.forEach((row) => counts.set(row.city_plate, (counts.get(row.city_plate) ?? 0) + 1));
  const cities = initialCities.map((city) => ({ ...city, votes: counts.get(city.plate) ?? 0 }));
  const leaders = Object.fromEntries((leaderRows as Leader[]).map((leader) => [leader.city_plate, leader]));
  return { cities, leaders, myCityPlate: visitorVote.data?.city_plate ?? null };
}

export async function GET(request: Request) {
  try {
    const visitor = new URL(request.url).searchParams.get("visitor");
    return Response.json(await state(isUuid(visitor) ? visitor : undefined));
  } catch {
    return Response.json({ error: "Veriler şu anda yüklenemedi." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!isUuid(body.visitorId) || !isPlate(body.cityPlate)) return Response.json({ error: "Geçersiz istek." }, { status: 400 });
    const supabase = database();

    if (body.action === "vote") {
      const { error } = await supabase.from("city_votes").upsert({ visitor_id: body.visitorId, city_plate: body.cityPlate, updated_at: new Date().toISOString() }, { onConflict: "visitor_id" });
      if (error) throw error;
      return Response.json(await state(body.visitorId));
    }

    if (body.action === "claim") {
      if (typeof body.title !== "string" || typeof body.url !== "string" || body.title.trim().length === 0 || body.title.trim().length > 120 || body.url.length > 2048) return Response.json({ error: "Başvuru bilgileri geçersiz." }, { status: 400 });
      try { new URL(body.url); } catch { return Response.json({ error: "Geçerli bir bağlantı gir." }, { status: 400 }); }
      const logoUrl = typeof body.logoUrl === "string" && body.logoUrl.length <= 2048 ? body.logoUrl : null;
      const { data: freeClaim, error: freeError } = await supabase.from("free_city_claims").select("visitor_id").eq("visitor_id", body.visitorId).maybeSingle();
      if (freeError) throw freeError;
      if (!freeClaim) {
        const { error: claimError } = await supabase.from("free_city_claims").insert({ visitor_id: body.visitorId, city_plate: body.cityPlate });
        if (claimError) throw claimError;
        const { error: leaderError } = await supabase.from("city_leaders").upsert({ city_plate: body.cityPlate, title: body.title.trim(), url: body.url, logo_url: logoUrl, price: 0, visitor_id: body.visitorId }, { onConflict: "city_plate" });
        if (leaderError) throw leaderError;
        return Response.json({ free: true, ...(await state(body.visitorId)) });
      }
      const { error: applicationError } = await supabase.from("city_applications").insert({ visitor_id: body.visitorId, city_plate: body.cityPlate, title: body.title.trim(), url: body.url, logo_url: logoUrl, offered_stars: 100 });
      if (applicationError) throw applicationError;
      return Response.json({ free: false, ...(await state(body.visitorId)) });
    }
    return Response.json({ error: "Bilinmeyen işlem." }, { status: 400 });
  } catch {
    return Response.json({ error: "İşlem kaydedilemedi." }, { status: 503 });
  }
}
