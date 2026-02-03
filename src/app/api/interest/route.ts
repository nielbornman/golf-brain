import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type Body = { email: string; tier: "plus" | "pro" };

export async function POST(req: Request) {
  let body: Body;

  try {
    body = await req.json();
  } catch {
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  const email = (body.email || "").trim().toLowerCase();
  const tier = body.tier;

  if (!email || !email.includes("@")) return new NextResponse("Invalid email", { status: 400 });
  if (tier !== "plus" && tier !== "pro") return new NextResponse("Invalid tier", { status: 400 });

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("interest_signups").insert([{ email, tier }]);

  if (error) return new NextResponse(error.message, { status: 500 });

  return NextResponse.json({ ok: true });
}