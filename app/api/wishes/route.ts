import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Wishes backend is not configured yet." }, { status: 503 });
  }

  const body = (await request.json()) as { name?: string; message?: string; guestToken?: string };
  const name = body.name?.trim();
  const message = body.message?.trim();

  if (!name || !message || name.length > 80 || message.length > 500) {
    return NextResponse.json({ error: "Please provide a valid name and message." }, { status: 400 });
  }

  const { error } = await supabase.from("wishes").insert({
    sender_name: name,
    message,
    guest_token: body.guestToken?.trim() || null,
  });

  if (error) {
    return NextResponse.json({ error: "Unable to save the wish." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
