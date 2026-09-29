import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { config } from "@/lib/config";

export async function POST(request: Request) {
  const formData = await request.formData();
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "/");

  if (!config.vipAccessPassword || password !== config.vipAccessPassword) {
    const url = new URL(`/login?error=1&next=${encodeURIComponent(next)}`, request.url);
    return NextResponse.redirect(url);
  }

  const cookieStore = await cookies();
  cookieStore.set("vip_auth", "ok", {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return NextResponse.redirect(new URL(next, request.url));
}
