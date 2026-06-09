import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const API_SECRET_KEY = process.env.API_SECRET_KEY!;
const SESSION_COOKIE = "ry_session";

export function verifyApiKey(key: string): boolean {
  return key === API_SECRET_KEY;
}

export async function getSession(): Promise<{ authenticated: boolean }> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE);
  return { authenticated: session?.value === API_SECRET_KEY };
}

export async function requireAuth(
  req: NextRequest
): Promise<NextResponse | null> {
  const session = req.cookies.get(SESSION_COOKIE);
  if (!session || session.value !== API_SECRET_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export function setSessionCookie(res: NextResponse, key: string) {
  res.cookies.set(SESSION_COOKIE, key, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.delete(SESSION_COOKIE);
}
