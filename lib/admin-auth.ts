import { NextRequest, NextResponse } from "next/server";

export function verifyAdmin(req: NextRequest): NextResponse | null {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  }
  const auth = req.headers.get("authorization");
  if (!auth || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
