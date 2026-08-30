import { NextRequest, NextResponse } from "next/server";

const STAR_PRICE = 100;
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
  if (payment?.currency === "XTR" && payment.total_amount === STAR_PRICE) {
    await telegramApi("sendMessage", {
      chat_id: message.chat.id,
      text: "100 Stars ödemen alındı. Liderlik başvurun incelemeye gönderildi; onaylandığında şehir haritasında yayınlanacak.",
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
