// Builds the Claude-hosted prototype into ./prototype:
//   PROTOTYPE=1 next build  →  .next-prototype/ (static export, relative ./_next/ paths)
//   index.html is turned into a page fragment (Claude wraps it in its own <html>/<head>/<body>),
//   and _next/ is copied next to it as supporting files.
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const src = path.join(root, ".next-prototype");
const out = path.join(root, "prototype");

if (!process.argv.includes("--no-build")) {
  execSync("npx next build", { cwd: root, stdio: "inherit", env: { ...process.env, PROTOTYPE: "1", PROTOTYPE_PREFIX: "./app" } });
}

const html = fs.readFileSync(path.join(src, "index.html"), "utf8");
const htmlTag = html.match(/<html([^>]*)>/)[1];
const bodyTag = html.match(/<body([^>]*)>/)[1];
const attr = (tag, name) => (tag.match(new RegExp(`${name}="([^"]*)"`)) ?? [])[1] ?? "";
const head = html.match(/<head>([\s\S]*?)<\/head>/)[1];
const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/)[1];

// Keep stylesheets, fonts and scripts from <head>; Claude's skeleton supplies charset + viewport.
const headKeep = head
  .replace(/<meta charSet="utf-8"\/>/i, "")
  .replace(/<meta name="viewport"[^>]*\/>/i, "")
  .replace(/<title>[\s\S]*?<\/title>/i, "")
  .replace(/<link rel="icon"[^>]*\/>/gi, "");

// The app's root layout puts its font variable and sizing classes on <html> and <body>;
// the hosted skeleton owns those elements, so set the same attributes before the app starts.
const setRootAttrs = `<script>(function(){var h=document.documentElement;h.lang=${JSON.stringify(attr(htmlTag, "lang"))};h.className=${JSON.stringify(
  attr(htmlTag, "class"),
)};document.body.className=${JSON.stringify(attr(bodyTag, "class"))};})();</script>`;

const fragment = `<title>Your First Morning</title>\n${setRootAttrs}\n${headKeep}\n${body}\n`;

// Empty the folder rather than delete it (Windows refuses to delete a folder that is open elsewhere).
fs.mkdirSync(out, { recursive: true });
for (const e of fs.readdirSync(out)) fs.rmSync(path.join(out, e), { recursive: true, force: true });
fs.writeFileSync(path.join(out, "index.html"), fragment);
// The host reserves paths starting with "_", so Next.js files live under app/_next/ (assetPrefix "./app").
fs.cpSync(path.join(src, "_next"), path.join(out, "app", "_next"), { recursive: true });

const files = [];
const walk = (d) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (p !== path.join(out, "index.html")) files.push(path.relative(out, p).split(path.sep).join("/"));
  }
};
walk(out);
// The host refuses files containing U+FFFD. In the bundles it only appears inside string literals
// (the legacy TextDecoder polyfill), where the escape sequence means exactly the same character.
for (const f of files.filter((f) => f.endsWith(".js"))) {
  const p = path.join(out, f);
  const t = fs.readFileSync(p, "utf8");
  const bad = String.fromCharCode(0xfffd);
  if (t.includes(bad)) fs.writeFileSync(p, t.split(bad).join("\\ufffd"));
}
fs.writeFileSync(path.join(out, "files.json"), JSON.stringify(files, null, 2));
console.log(`prototype/: index.html + ${files.length} supporting files`);
