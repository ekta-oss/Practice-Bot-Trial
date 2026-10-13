// Imports the illustrator's scenes (designer mock-ups, 1672×941 PNG) into public/media/images
// as WebP, cropping away the screen furniture painted into the mock-ups (title bar, buttons,
// burnt-in subtitles) so the app's own controls are not doubled.
//   node scripts/import-art.mjs "C:/…/Communication Module 1 Asset"
import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const srcDir = process.argv[2];
if (!srcDir) throw new Error("usage: node scripts/import-art.mjs <asset folder>");
const out = path.resolve(import.meta.dirname, "..", "public", "media", "images");

// [output file, source file (by number), crop x0, y0, x1, y1] in source pixels.
const JOBS = [
  ["M2_S01_01_IMG_01_arrival.webp", 13, 0, 0, 1672, 941], // you open the glass door; PIC at reception
  ["M2_S01_01_IMG_02_welcome.webp", 14, 150, 0, 1533, 778], // PIC welcomes you (burnt-in subtitle cropped off)
  ["M2_S01_01_IMG_03_pointing.webp", 16, 280, 0, 1604, 745], // PIC points down the corridor (subtitle cropped off)
  ["M2_S01_02_IMG_01_entrance.webp", 19, 0, 72, 1672, 835],
  ["M2_S01_02_IMG_02_corridor.webp", 20, 0, 70, 1672, 822],
  ["M2_S01_02_IMG_03_pantry.webp", 21, 0, 64, 1672, 850],
  ["M2_S01_02_IMG_04_meeting-room.webp", 25, 0, 82, 1672, 805],
  // The 12 signs, cut out of the same art so a sign looks the same in the scene, the notebook and the games.
  ["M2_S01_SIGN_assembly-point.webp", 19, 534, 232, 626, 379],
  ["M2_S01_SIGN_no-smoking.webp", 19, 1001, 223, 1120, 392],
  ["M2_S01_SIGN_no-entry-staff-only.webp", 20, 190, 127, 345, 399],
  ["M2_S01_SIGN_wear-gloves.webp", 20, 190, 425, 345, 682],
  ["M2_S01_SIGN_fire-extinguisher.webp", 20, 1124, 159, 1221, 287],
  ["M2_S01_SIGN_electrical-hazard.webp", 20, 1391, 296, 1501, 514],
  ["M2_S01_SIGN_wash-hands.webp", 21, 420, 184, 551, 362],
  ["M2_S01_SIGN_hot-water.webp", 21, 818, 341, 946, 402],
  ["M2_S01_SIGN_wet-floor.webp", 21, 148, 541, 374, 836],
  ["M2_S01_SIGN_first-aid.webp", 21, 1146, 111, 1339, 309],
  ["M2_S01_SIGN_fire-exit.webp", 25, 761, 101, 937, 164],
  ["M2_S01_SIGN_keep-fire-door-shut.webp", 25, 820, 240, 894, 343],
];

const files = fs.readdirSync(srcDir).filter((f) => f.endsWith(".png"));
const byNum = (n) => files.find((f) => f.endsWith(`-${n}.png`));

fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage();
const report = [];
for (const [name, n, x0, y0, x1, y1] of JOBS) {
  const file = byNum(n);
  if (!file) throw new Error(`image ${n} not found`);
  const dataUrl = "data:image/png;base64," + fs.readFileSync(path.join(srcDir, file)).toString("base64");
  const webp = await page.evaluate(
    async ({ dataUrl, x0, y0, x1, y1 }) => {
      const img = new Image();
      img.src = dataUrl;
      await img.decode();
      const c = document.createElement("canvas");
      c.width = x1 - x0;
      c.height = y1 - y0;
      c.getContext("2d").drawImage(img, x0, y0, c.width, c.height, 0, 0, c.width, c.height);
      return c.toDataURL("image/webp", 0.86).split(",")[1];
    },
    { dataUrl, x0, y0, x1, y1 },
  );
  const buf = Buffer.from(webp, "base64");
  fs.writeFileSync(path.join(out, name), buf);
  report.push(`${name}  ←  ${file}  crop ${x1 - x0}×${y1 - y0}  ${(buf.length / 1024).toFixed(0)} KB`);
}

// Sample the mock-ups' UI colours (top bar, Next place button, finish button).
const colours = await page.evaluate(
  async (urls) => {
    const pick = async (url, pts) => {
      const img = new Image();
      img.src = url;
      await img.decode();
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      const g = c.getContext("2d");
      g.drawImage(img, 0, 0);
      return pts.map(([x, y]) => "#" + [...g.getImageData(x, y, 1, 1).data.slice(0, 3)].map((v) => v.toString(16).padStart(2, "0")).join(""));
    };
    return {
      bar20: await pick(urls[0], [[1100, 20], [300, 900]]),
      next20: await pick(urls[0], [[1500, 870]]),
      finish25: await pick(urls[1], [[1300, 870]]),
      pill25: await pick(urls[1], [[880, 25]]),
    };
  },
  [20, 25].map((n) => "data:image/png;base64," + fs.readFileSync(path.join(srcDir, byNum(n))).toString("base64")),
);
await browser.close();
console.log(report.join("\n"));
console.log("colours", JSON.stringify(colours));
