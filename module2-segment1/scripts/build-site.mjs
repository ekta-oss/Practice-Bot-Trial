// Builds the static website (plain HTML + JS/CSS/fonts) into ../module2-segment1-site,
// ready to push to GitHub and deploy on Vercel (or any static host).
//   node scripts/build-site.mjs
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const src = path.join(root, ".next-prototype");
const out = path.resolve(root, "..", "module2-segment1-site");

// Relative asset paths ("./_next/…") so the site works at a domain root or in a sub-folder.
execSync("npx next build", { cwd: root, stdio: "inherit", env: { ...process.env, PROTOTYPE: "1", PROTOTYPE_PREFIX: "." } });

fs.mkdirSync(out, { recursive: true });
for (const e of fs.readdirSync(out)) fs.rmSync(path.join(out, e), { recursive: true, force: true });
fs.cpSync(src, out, { recursive: true });

// Next writes internal router data (*.txt) that a single-page static site does not need.
const prune = (d) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) {
      if (p === path.join(out, "media")) continue;
      prune(p);
      if (fs.readdirSync(p).length === 0) fs.rmdirSync(p);
    } else if (e.name.endsWith(".txt")) fs.rmSync(p);
  }
};
prune(out);
// The media folders only hold READMEs until the produced files are delivered.
fs.mkdirSync(path.join(out, "media", "audio"), { recursive: true });
fs.mkdirSync(path.join(out, "media", "video"), { recursive: true });
fs.mkdirSync(path.join(out, "media", "images"), { recursive: true });

fs.writeFileSync(
  path.join(out, "vercel.json"),
  JSON.stringify(
    {
      $schema: "https://openapi.vercel.sh/vercel.json",
      cleanUrls: true,
      headers: [
        {
          source: "/(.*)",
          headers: [{ key: "Permissions-Policy", value: "microphone=(self)" }],
        },
      ],
    },
    null,
    2,
  ) + "\n",
);

fs.writeFileSync(
  path.join(out, "README.md"),
  `# Your First Morning — Module 2, Segment 1 (Stages 1.1–1.6)

A static build of the learning platform: plain HTML, JavaScript, CSS and fonts. No server and no build step are needed to host it.

Built from \`module2-segment1/\` with \`node scripts/build-site.mjs\`. Do not edit these files by hand; change the source and rebuild.

## Deploy on Vercel

1. Push this repository to GitHub.
2. In Vercel, choose **Add New → Project** and import the repository.
3. Set **Root Directory** to \`module2-segment1-site\`.
4. Set **Framework Preset** to **Other**. Leave the build command and output directory empty.
5. Choose **Deploy**. Vercel gives you an \`https://….vercel.app\` link.

The microphone works on the Vercel link because it is HTTPS. \`vercel.json\` allows this site to use the microphone.

## Try it on your own computer

Open a terminal in this folder and run:

\`\`\`bash
npx serve .
\`\`\`

Then open the address it prints. Opening \`index.html\` by double-clicking does not work, because browsers block scripts on \`file://\` pages.

## Adding the produced media

Put the delivered files in \`media/audio\`, \`media/video\` and \`media/images\`, named exactly as in \`module2-segment1/docs/ASSET_MANIFEST.md\`. Then push again. The course uses them straight away; until then, each missing file is marked on screen.
`,
);

let count = 0;
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : count++));
walk(out);
console.log(`module2-segment1-site/: ${count} files`);
