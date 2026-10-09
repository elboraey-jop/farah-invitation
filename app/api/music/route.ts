import { readFile } from "node:fs/promises";
import path from "node:path";

const musicFilePath = path.join(process.cwd(), "public", "assets", "music", "farh-music.mp3");

export async function POST() {
  try {
    const audio = await readFile(musicFilePath);
    return Response.json(
      { data: audio.toString("base64"), mimeType: "audio/mpeg" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json({ error: "Music is unavailable" }, { status: 404 });
  }
}
