import { NextResponse } from "next/server";

export async function GET() {
  const res = await fetch(`${process.env.ZERNIO_API_BASE}/v1/accounts`, {
    headers: { Authorization: `Bearer ${process.env.ZERNIO_API_KEY}` },
    cache: "no-store",
  });
  if (!res.ok) return NextResponse.json({ accounts: [] });
  const data = await res.json();
  return NextResponse.json(data.accounts ?? []);
}
