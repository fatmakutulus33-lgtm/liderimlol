import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const STAR_PRICE = 100;
const database = () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Supabase bağlantısı yapılandırılmamış.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
};
const telegramApi = (method: string, body: Record<string, unknown>) => {
  const token = process.env.LIDERIM_TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("LIDERIM_TELEGRAM_BOT_TOKEN is not configured");
  return fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
};

export async function POST(request: NextRequest) {
  const update = await request.json();
  const preCheckout = update.pre_checkout_query;
  if (preCheckout) {
    await telegramApi("answerPreCheckoutQuery", { pre_checkout_query_id: preCheckout.id, ok: true });
    return NextResponse.json({ ok: true });
  }

  const message = update.message;
  if (!message) return NextResponse.json({ ok: true });

  const payment = message.successful_payment;
  if (payment?.currency === "XTR" && payment.total_amount > 0) {
    const payloadMatch = /^aga_(\d{2})_(?:\d+|user)$/.exec(payment.invoice_payload ?? "");
    if (payloadMatch) {
      const supabase = database();
      const { error } = await supabase.from("star_payments").upsert({
        telegram_payment_charge_id: payment.telegram_payment_charge_id,
        city_plate: payloadMatch[1],
        stars: payment.total_amount,
        telegram_user_id: message.from?.id ?? null,
        invoice_payload: payment.invoice_payload,
      }, { onConflict: "telegram_payment_charge_id" });
      if (error) throw error;

      const { data: application, error: applicationError } = await supabase
        .from("city_applications")
        .select("id,visitor_id,title,url,logo_url")
        .eq("city_plate", payloadMatch[1])
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (applicationError) throw applicationError;

      if (application) {
        const { data: currentLeader, error: currentLeaderError } = await supabase
          .from("city_leaders")
          .select("visitor_id,title,url,logo_url,price")
          .eq("city_plate", payloadMatch[1])
          .maybeSingle();
        if (currentLeaderError) throw currentLeaderError;

        if (currentLeader) {
          const { error: historyError } = await supabase.from("city_applications").insert({
            visitor_id: currentLeader.visitor_id,
            city_plate: payloadMatch[1],
            title: currentLeader.title,
            url: currentLeader.url,
            logo_url: currentLeader.logo_url,
            offered_stars: currentLeader.price,
            status: "historical",
          });
          if (historyError) throw historyError;
        }

        const { error: leaderUpdateError } = await supabase.from("city_leaders").upsert({
          city_plate: payloadMatch[1],
          visitor_id: application.visitor_id,
          title: application.title,
          url: application.url,
          logo_url: application.logo_url,
          price: payment.total_amount,
        }, { onConflict: "city_plate" });
        if (leaderUpdateError) throw leaderUpdateError;

        const { error: approvalError } = await supabase
          .from("city_applications")
          .update({ status: "approved" })
          .eq("id", application.id);
        if (approvalError) throw approvalError;
      }
    }
    await telegramApi("sendMessage", {
      chat_id: message.chat.id,
      text: `${payment.total_amount} Stars ödemen alındı. Başvurun onaylandı; liderlik ve şehir geçmişi güncellendi.`,
    });
    return NextResponse.json({ ok: true });
  }

  const text = typeof message.text === "string" ? message.text : "";
  const match = text.match(/^\/start\s+aga_(\d{1,2})$/);
  if (match) {
    const plate = match[1].padStart(2, "0");
    await telegramApi("sendInvoice", {
      chat_id: message.chat.id,
      title: "Liderim.lol Ağalık Başvurusu",
      description: `${plate} plakalı şehir için liderlik başvurusu`,
      payload: `aga_${plate}_${message.from?.id ?? "user"}`,
      currency: "XTR",
      prices: [{ label: "Ağalık başvurusu", amount: STAR_PRICE }],
    });
    return NextResponse.json({ ok: true });
  }

  await telegramApi("sendMessage", {
    chat_id: message.chat.id,
    text: "Bir şehirden ‘100 Stars ile başvur’ düğmesine dokunarak ağalık başvurusunu başlatabilirsin.",
  });
  return NextResponse.json({ ok: true });
}
