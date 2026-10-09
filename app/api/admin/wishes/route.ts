import { NextResponse } from "next/server";
import { getSupabaseAdmin, getSupabasePublic } from "@/lib/supabase";

async function authorize(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const supabase = getSupabasePublic();
  const configuredAdminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!token || !supabase || !configuredAdminEmail) return false;

  try {
    const { data } = await supabase.auth.getUser(token);
    return data.user?.email?.trim().toLowerCase() === configuredAdminEmail;
  } catch {
    return false;
  }
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

  let body: { id?: string; ids?: string[]; status?: "unread" | "read" | "archived" };
  try {
    body = (await request.json()) as { id?: string; ids?: string[]; status?: "unread" | "read" | "archived" };
  } catch {
    return NextResponse.json({ error: "Invalid update." }, { status: 400 });
  }
  const ids = Array.from(new Set([...(Array.isArray(body.ids) ? body.ids : []), ...(body.id ? [body.id] : [])])).filter((id) => typeof id === "string" && id.length > 0);
  if (ids.length === 0 || ids.length > 100 || !body.status || !["unread", "read", "archived"].includes(body.status)) {
    return NextResponse.json({ error: "Invalid update." }, { status: 400 });
  }

  const { error } = await supabase.from("wishes").update({ status: body.status }).in("id", ids);
  if (error) return NextResponse.json({ error: "Unable to update wish." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
