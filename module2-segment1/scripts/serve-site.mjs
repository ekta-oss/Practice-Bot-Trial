// Serves ../module2-segment1-site like a static host such as Vercel (clean URLs, 404 page).
// Used by e2e/site.spec.ts.   Usage: node scripts/serve-site.mjs [port]
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..", "..", "module2-segment1-site");
const port = Number(process.argv[2] ?? 3300);
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
  ".json": "application/json",
  ".txt": "text/plain",
  ".mp3": "audio/mpeg",
  ".mp4": "video/mp4",
  ".vtt": "text/vtt",
  ".webp": "image/webp",
};

http
  .createServer((req, res) => {
    const rel = decodeURIComponent(new URL(req.url, "http://x").pathname).replace(/^\/+/, "") || "index.html";
    const candidates = [rel, rel + ".html", path.join(rel, "index.html")];
    const hit = candidates.map((c) => path.join(root, c)).find((f) => f.startsWith(root) && fs.existsSync(f) && fs.statSync(f).isFile());
    const headers = { "Permissions-Policy": "microphone=(self)" };
    if (!hit) {
      res.writeHead(404, { ...headers, "content-type": types[".html"] });
      return res.end(fs.readFileSync(path.join(root, "404.html")));
    }
    res.writeHead(200, { ...headers, "content-type": types[path.extname(hit)] ?? "application/octet-stream" });
    if (req.method === "HEAD") return res.end();
    fs.createReadStream(hit).pipe(res);
  })
  .listen(port, () => console.log(`site at http://localhost:${port}/`));
