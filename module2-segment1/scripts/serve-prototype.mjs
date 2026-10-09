// Serves ./prototype the way the Claude-hosted page is served: index.html wrapped in the
// publish skeleton, under a sub-path, with a Content-Security-Policy that only allows the
// page's own files. Used by e2e/prototype.spec.ts.  Usage: node scripts/serve-prototype.mjs [port]
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..", "prototype");
const port = Number(process.argv[2] ?? 3200);
const BASE = "/artifact/demo/";
const skeleton = (content) =>
  `<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light;padding:env(safe-area-inset-top,0px) 0 env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui,sans-serif;background:#fafaf8}img{max-width:100%}[hidden]{display:none!important}</style></head><body>${content}</body></html>`;
const types = { ".js": "text/javascript", ".css": "text/css", ".woff2": "font/woff2", ".json": "application/json", ".txt": "text/plain" };

http
  .createServer((req, res) => {
    const url = new URL(req.url, "http://x");
    if (!url.pathname.startsWith(BASE)) {
      res.writeHead(302, { location: BASE });
      return res.end();
    }
    const rel = decodeURIComponent(url.pathname.slice(BASE.length)) || "index.html";
    const file = path.join(root, rel);
    if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404, { "content-type": "text/plain" });
      return res.end("not found");
    }
    const csp = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; media-src 'self' blob: data:; img-src 'self' blob: data:; connect-src 'self'";
    if (rel === "index.html") {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8", "content-security-policy": csp });
      return res.end(skeleton(fs.readFileSync(file, "utf8")));
    }
    res.writeHead(200, { "content-type": types[path.extname(file)] ?? "application/octet-stream", "content-security-policy": csp });
    fs.createReadStream(file).pipe(res);
  })
  .listen(port, () => console.log(`prototype at http://localhost:${port}${BASE}`));
