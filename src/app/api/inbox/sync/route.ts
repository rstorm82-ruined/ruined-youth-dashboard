import { NextResponse } from "next/server";
import { db } from "@/db";
import { dms, profiles } from "@/db/schema";
import { getDMs } from "@/lib/zernio";

export async function POST() {
  const allProfiles = await db.select().from(profiles);
  let total = 0;

  for (const profile of allProfiles) {
    try {
      const messages = await getDMs(profile.zernioAccountId);
      for (const msg of messages) {
        await db
          .insert(dms)
          .values({
            profileId: profile.id,
            platform: profile.platform,
            sender: msg.sender,
            senderAvatarUrl: msg.sender_avatar ?? null,
            message: msg.message,
            zernioMessageId: msg.id,
            receivedAt: new Date(msg.received_at),
          })
          .onConflictDoNothing();
        total++;
      }
    } catch {
      // skip failed accounts
    }
  }

  return NextResponse.json({ synced: total });
}
