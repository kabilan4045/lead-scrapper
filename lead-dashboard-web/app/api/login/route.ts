import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, makeSessionToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const passcode = process.env.APP_PASSCODE;
  if (!passcode) {
    return NextResponse.json(
      { error: "Server is not configured with a passcode." },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => null);
  const submitted = body?.passcode;
  if (typeof submitted !== "string" || submitted !== passcode) {
    return NextResponse.json({ error: "Incorrect passcode." }, { status: 401 });
  }

  const token = await makeSessionToken(passcode);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 180, // ~6 months
    path: "/",
  });
  return response;
}
