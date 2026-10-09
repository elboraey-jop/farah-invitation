import { NextResponse } from "next/server";
import { getSupabaseAdmin, getSupabasePublic } from "@/lib/supabase";

async function authorize(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const supabase = getSupabasePublic();
  if (!token || !supabase) return false;

  const { data } = await supabase.auth.getUser(token);
  return Boolean(data.user && data.user.email === (process.env.ADMIN_EMAIL || "admin@example.com"));
}

export async function GET(request: Request) {
  if (!(await authorize(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Admin backend is not configured yet." }, { status: 503 });

  const { data, error } = await supabase.from("wishes").select("id, sender_name, message, status, created_at").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Unable to load wishes." }, { status: 500 });
  return NextResponse.json({ wishes: data });
}

export async function PATCH(request: Request) {
  if (!(await authorize(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Admin backend is not configured yet." }, { status: 503 });

  const body = (await request.json()) as { id?: string; status?: "unread" | "read" | "archived" };
  if (!body.id || !body.status) return NextResponse.json({ error: "Invalid update." }, { status: 400 });

  const { error } = await supabase.from("wishes").update({ status: body.status }).eq("id", body.id);
  if (error) return NextResponse.json({ error: "Unable to update wish." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
