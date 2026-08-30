import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

type ChatMessage = {
  id: string;
  visitor_id: string;
  nickname: string;
  body: string;
  created_at: string;
};

const isUuid = (value: unknown): value is string =>
  typeof value === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

function database() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Supabase bağlantısı yapılandırılmamış.");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function recentMessages() {
  const { data, error } = await database()
    .from("site_chat_messages")
    .select("id,visitor_id,nickname,body,created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data as ChatMessage[]).reverse();
}

export async function GET() {
  try {
    return Response.json({ messages: await recentMessages() });
  } catch {
    return Response.json({ error: "Sohbet şu anda yüklenemedi." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!isUuid(body.visitorId) || typeof body.message !== "string") {
      return Response.json({ error: "Geçersiz mesaj." }, { status: 400 });
    }

    const nickname = typeof body.nickname === "string" ? body.nickname.trim() : "";
    const message = body.message.trim();
    if (!message || message.length > 500 || nickname.length > 32) {
      return Response.json({ error: "Mesaj veya takma ad çok uzun." }, { status: 400 });
    }

    const supabase = database();
    const { data: latest, error: latestError } = await supabase
      .from("site_chat_messages")
      .select("created_at")
      .eq("visitor_id", body.visitorId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (latestError) throw latestError;
    if (latest && Date.now() - new Date(latest.created_at).getTime() < 8_000) {
      return Response.json({ error: "Bir sonraki mesaj için birkaç saniye bekle." }, { status: 429 });
    }

    const { error } = await supabase.from("site_chat_messages").insert({
      visitor_id: body.visitorId,
      nickname: nickname || "Misafir",
      body: message,
    });
    if (error) throw error;
    return Response.json({ messages: await recentMessages() });
  } catch {
    return Response.json({ error: "Mesaj gönderilemedi." }, { status: 503 });
  }
}
