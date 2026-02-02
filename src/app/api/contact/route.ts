import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type Body = { name: string; email: string; message: string };

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) throw new Error("Missing Supabase env vars");
  return createClient(url, anon, { auth: { persistSession: false } });
}

export async function POST(req: Request) {
  let body: Body;

  try {
    body = await req.json();
  } catch {
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  const name = (body.name || "").trim();
  const email = (body.email || "").trim().toLowerCase();
  const message = (body.message || "").trim();

  if (!name || name.length < 2) return new NextResponse("Invalid name", { status: 400 });
  if (!email || !email.includes("@")) return new NextResponse("Invalid email", { status: 400 });
  if (!message || message.length < 5) return new NextResponse("Invalid message", { status: 400 });

  const supabase = getSupabase();
  const { error } = await supabase.from("contact_messages").insert({ name, email, message });

  if (error) return new NextResponse(error.message, { status: 500 });

  return NextResponse.json({ ok: true });
}