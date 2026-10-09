import { readFile } from "node:fs/promises";
import path from "node:path";

const musicFilePath = path.join(process.cwd(), "public", "assets", "music", "farh-music.mp3");

export async function GET() {
  try {
    const audio = await readFile(musicFilePath);
    return new Response(audio, {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Length": String(audio.byteLength),
        "Content-Type": "audio/mpeg",
      },
    });
  } catch {
    return Response.json({ error: "Music is unavailable" }, { status: 404 });
  }
}
