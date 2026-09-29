import { NextResponse } from "next/server";
import { appendVipNote } from "@/lib/vip-db";

export async function POST(request: Request) {
  const formData = await request.formData();
  const companyKey = String(formData.get("companyKey") || "");
  const companyName = String(formData.get("companyName") || "").trim();
  const author = String(formData.get("author") || "").trim();
  const consultationType = String(formData.get("consultationType") || "").trim();
  const note = String(formData.get("note") || "").trim();
  const nextAction = String(formData.get("nextAction") || "").trim();
  const priority = String(formData.get("priority") || "일반").trim();

  if (!companyKey || !companyName || !author || !consultationType || !note) {
    return NextResponse.json({ error: "필수 항목이 누락되었습니다." }, { status: 400 });
  }

  await appendVipNote({
    companyName,
    author,
    consultationType,
    note,
    nextAction,
    priority,
  });

  return NextResponse.redirect(new URL(`/companies/${encodeURIComponent(companyKey)}/notes?saved=1`, request.url));
}
