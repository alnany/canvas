import { NextResponse } from "next/server";
import { LIBRARY, LIB_KEYS } from "../../../world/engine";

// Locked world art style — every prompt is wrapped in this so the world stays coherent.
const STYLE =
  "16-bit Japanese retro JRPG pixel art sprite, SNES era, 3/4 top-down view, single isolated object centered, " +
  "crisp pixel edges, limited warm palette, soft dark outline, no text, transparent background. Subject: ";

// Minimal prototype moderation. Production: provider moderation endpoint + IP/brand filter + human review queue.
const BLOCK = /\b(nude|naked|nsfw|sex|porn|gore|blood|nazi|swastika|kill|hitler|terror|mickey|pikachu|mario|disney|nintendo|marvel)\b/i;

export async function POST(req: Request) {
  let prompt = "";
  try {
    const body = (await req.json()) as { prompt?: unknown };
    prompt = typeof body.prompt === "string" ? body.prompt.trim().slice(0, 200) : "";
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  if (prompt.length < 3) return NextResponse.json({ error: "Prompt too short" }, { status: 400 });
  if (BLOCK.test(prompt)) return NextResponse.json({ error: "This prompt breaks the world rules (NSFW, violence or copyrighted characters)." }, { status: 422 });

  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    const r = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.WORLD_IMAGE_MODEL || "gpt-image-1",
        prompt: STYLE + prompt,
        size: "1024x1024",
        quality: "low",
        background: "transparent",
        n: 1,
      }),
    });
    if (!r.ok) {
      const t = await r.text();
      return NextResponse.json({ error: "Generator error", detail: t.slice(0, 300) }, { status: 502 });
    }
    const j = (await r.json()) as { data?: { b64_json?: string }[] };
    const b64 = j.data?.[0]?.b64_json;
    if (!b64) return NextResponse.json({ error: "Generator returned no image" }, { status: 502 });
    return NextResponse.json({ src: `data:image/png;base64,${b64}`, mode: "ai" });
  }

  // Prototype fallback: match the prompt to the pre-generated style library.
  const words = prompt.toLowerCase();
  let best = "";
  for (const k of LIB_KEYS) if (LIBRARY[k].some(w => words.includes(w))) { best = k; break; }
  if (!best) {
    let h = 0; for (const ch of words) h = (h * 31 + ch.charCodeAt(0)) | 0;
    best = LIB_KEYS[Math.abs(h) % LIB_KEYS.length];
  }
  return NextResponse.json({ src: `/world/sprites/${best}.png`, mode: "library", matched: best });
}
