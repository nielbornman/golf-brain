import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type Body = { name?: string; email: string; message: string };

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

  if (!email || !email.includes("@")) return new NextResponse("Invalid email", { status: 400 });
  if (!message || message.length < 5) return new NextResponse("Message too short", { status: 400 });

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("contact_messages")
    .insert([{ name: name || null, email, message }]);

  if (error) return new NextResponse(error.message, { status: 500 });

  return NextResponse.json({ ok: true });
}