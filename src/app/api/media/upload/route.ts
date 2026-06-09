import { NextRequest, NextResponse } from "next/server";
import { uploadToR2 } from "@/lib/r2";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const ext = file.name.split(".").pop() ?? "bin";
  const key = `uploads/${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const url = await uploadToR2(key, buffer, file.type);
  return NextResponse.json({ url, key });
}
