import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const { prompt, profileCount } = await req.json();

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `Write a social media caption for the following context. Keep it engaging, natural, and platform-appropriate. Return only the caption text with no explanation.

Context: ${prompt || "general lifestyle post"}
Posting to: ${profileCount ?? 1} account(s)`,
      },
    ],
    system:
      "You are a social media copywriter for a streetwear and skate brand called Ruined Youth. Write punchy, authentic captions with attitude. Short, impactful. No corporate speak.",
  });

  const caption = message.content[0].type === "text" ? message.content[0].text : "";
  return NextResponse.json({ caption });
}
