"use client";

/**
 * INTERIM SCENE ART (build-drawn flat vector), following the Settings Sheet
 * and the Stage 1.2 Visuals box. Each scene can be replaced by the
 * illustration team's file in /public/media/images (see ASSET_MANIFEST.md);
 * the sign hotspots stay in the places listed in the script.
 */

import type { PlaceId } from "@/content/segment1";

const P = {
  wall: "#efe6d6",
  wallShade: "#e2d5bf",
  floor: "#b9b2a6",
  floorDark: "#a39b8e",
  wood: "#a8743f",
  woodDark: "#865a2e",
  glass: "#cfe7ee",
  glassEdge: "#7c9aa5",
  outside: "#9fc98a",
  sky: "#cde6f2",
  grey: "#8f969c",
  greyDark: "#6b7177",
  white: "#fbfaf7",
  skin: "#8d5a3b",
  skinShade: "#764a30",
  hair: "#2a1d17",
  picShirt: "#1f5a3a",
  red: "#C8102E",
};

/* ---------------- Person in charge (fixed appearance) ---------------- */
/** About 40. Dark green collared shirt, ID card on a lanyard, reading glasses pushed up on the head, a small notebook in the shirt pocket. */
export function PersonInCharge({ x, y, scale = 1, pose = "stand" }: { x: number; y: number; scale?: number; pose?: "stand" | "point" | "sit" }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} data-character="PIC">
      {/* body */}
      <path d="M-70 260 Q-80 140 -40 120 L40 120 Q80 140 70 260 Z" fill={P.picShirt} />
      {/* collar */}
      <path d="M-22 120 L0 150 L22 120 L12 112 L0 128 L-12 112Z" fill="#17482e" />
      {/* lanyard + ID */}
      <path d="M-14 122 L-4 190 M14 122 L4 190" stroke="#c0392b" strokeWidth="4" />
      <rect x="-14" y="188" width="28" height="36" rx="3" fill={P.white} stroke="#555" strokeWidth="1.5" />
      <rect x="-8" y="194" width="16" height="12" fill="#9bb" />
      {/* pocket notebook */}
      <rect x="26" y="150" width="26" height="30" rx="2" fill="#17482e" />
      <rect x="30" y="140" width="18" height="22" rx="1" fill="#f3e3b5" stroke="#8a6d2b" strokeWidth="1.5" />
      {/* neck + head */}
      <rect x="-12" y="88" width="24" height="30" fill={P.skinShade} />
      <ellipse cx="0" cy="58" rx="40" ry="46" fill={P.skin} />
      {/* hair with low bun */}
      <path d="M-42 56 Q-44 6 0 8 Q44 6 42 56 Q36 26 0 24 Q-36 26 -42 56Z" fill={P.hair} />
      <circle cx="0" cy="12" r="0" />
      <ellipse cx="34" cy="80" rx="14" ry="12" fill={P.hair} />
      {/* reading glasses pushed up on head */}
      <g fill="none" stroke="#3b2f2a" strokeWidth="3">
        <rect x="-30" y="14" width="24" height="14" rx="6" />
        <rect x="6" y="14" width="24" height="14" rx="6" />
        <path d="M-6 21 H6" />
      </g>
      {/* face */}
      <circle cx="-14" cy="58" r="3.5" fill="#1d1410" />
      <circle cx="14" cy="58" r="3.5" fill="#1d1410" />
      <path d="M-12 78 Q0 88 12 78" stroke="#4a2a1c" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* arms */}
      {pose === "point" ? (
        <>
          <path d="M-62 150 Q-90 210 -60 250" stroke={P.picShirt} strokeWidth="26" fill="none" strokeLinecap="round" />
          <path d="M60 150 Q120 150 170 120" stroke={P.picShirt} strokeWidth="26" fill="none" strokeLinecap="round" />
          <path d="M168 120 l34 -10 m-34 10 l30 4 m-30 -4 l26 14" stroke={P.skin} strokeWidth="9" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M-62 150 Q-90 210 -60 250" stroke={P.picShirt} strokeWidth="26" fill="none" strokeLinecap="round" />
          <path d="M62 150 Q90 210 60 250" stroke={P.picShirt} strokeWidth="26" fill="none" strokeLinecap="round" />
        </>
      )}
    </g>
  );
}

/* ---------------- Scenes ---------------- */

function Entrance({ withPic }: { withPic?: "stand" | "point" | false }) {
  return (
    <>
      <rect width="1600" height="900" fill={P.wall} />
      <rect y="700" width="1600" height="200" fill={P.floor} />
      <path d="M0 700 H1600" stroke={P.floorDark} strokeWidth="4" />
      {/* glass door frame + outside view */}
      <rect x="560" y="110" width="480" height="600" fill={P.greyDark} />
      <rect x="575" y="125" width="450" height="575" fill={P.sky} />
      <rect x="575" y="470" width="450" height="230" fill={P.outside} />
      {/* outside wall seen through the glass, left side */}
      <rect x="585" y="200" width="200" height="300" fill="#d9cbb4" />
      <rect x="575" y="125" width="450" height="575" fill={P.glass} opacity="0.45" />
      <path d="M800 125 V700" stroke={P.greyDark} strokeWidth="10" />
      <path d="M640 160 L700 140 M880 160 L960 135" stroke="white" strokeWidth="6" opacity="0.6" />
      <rect x="770" y="380" width="14" height="80" rx="5" fill={P.grey} />
      <rect x="816" y="380" width="14" height="80" rx="5" fill={P.grey} />
      {/* notice board */}
      <rect x="250" y="200" width="220" height="160" fill={P.wood} />
      <rect x="262" y="212" width="196" height="136" fill="#d8b98a" />
      <rect x="280" y="226" width="70" height="50" fill={P.white} />
      <rect x="370" y="232" width="70" height="90" fill={P.white} />
      <rect x="290" y="290" width="60" height="44" fill="#f5e6a8" />
      {/* shoe rack, left */}
      <g>
        <rect x="120" y="520" width="300" height="180" fill={P.woodDark} />
        <rect x="132" y="532" width="276" height="70" fill="#5b3c1f" />
        <rect x="132" y="616" width="276" height="70" fill="#5b3c1f" />
        {[150, 220, 290, 350].map((x) => (
          <ellipse key={x} cx={x + 20} cy="590" rx="26" ry="10" fill={x % 140 === 10 ? "#334" : "#7a3b2e"} />
        ))}
        {[160, 250, 330].map((x) => (
          <ellipse key={x} cx={x + 20} cy="674" rx="26" ry="10" fill="#4a4a4a" />
        ))}
      </g>
      {/* reception desk, right, with small bell */}
      {withPic && <PersonInCharge x={1330} y={300} scale={1.15} pose={withPic === "point" ? "point" : "stand"} />}
      <rect x="1120" y="520" width="440" height="190" fill={P.wood} />
      <rect x="1100" y="500" width="480" height="30" fill={P.woodDark} />
      <rect x="1180" y="440" width="130" height="62" rx="4" fill="#2f3b44" />
      <rect x="1188" y="448" width="114" height="46" fill="#6aa6c2" />
      <path d="M1440 498 a22 22 0 0 1 44 0z" fill="#c9a43a" />
      <rect x="1458" y="468" width="8" height="10" rx="3" fill="#c9a43a" />
    </>
  );
}

function Corridor() {
  // One-point perspective: vanishing point (800, 380)
  return (
    <>
      <rect width="1600" height="900" fill={P.wall} />
      {/* ceiling */}
      <path d="M0 0 H1600 L960 250 H640 Z" fill="#f6f1e7" />
      {/* floor (grey) */}
      <path d="M0 900 H1600 L960 560 H640 Z" fill={P.floor} />
      {/* left wall */}
      <path d="M0 0 L640 250 V560 L0 900 Z" fill={P.white} />
      {/* right wall */}
      <path d="M1600 0 L960 250 V560 L1600 900 Z" fill="#f2f0ea" />
      {/* far wall */}
      <rect x="640" y="250" width="320" height="310" fill={P.wallShade} />
      <rect x="760" y="330" width="90" height="230" fill="#c5b79f" />
      {/* store-room door on the left wall */}
      <path d="M190 150 L430 240 V690 L190 790 Z" fill={P.wood} stroke={P.woodDark} strokeWidth="6" />
      <circle cx="400" cy="480" r="9" fill="#c9a43a" />
      {/* fuse box, right wall (grey) */}
      <path d="M1170 300 L1300 260 V470 L1170 480 Z" fill={P.grey} stroke={P.greyDark} strokeWidth="5" />
      <path d="M1180 470 L1290 462" stroke={P.greyDark} strokeWidth="3" />
      {/* fire extinguisher hanging on the right wall, near the far end */}
      <rect x="985" y="455" width="30" height="72" rx="10" fill={P.red} />
      <rect x="993" y="440" width="14" height="16" fill="#333" />
      <path d="M1007 444 h16 l6 10" stroke="#333" strokeWidth="4" fill="none" />
      <rect x="980" y="428" width="40" height="6" fill={P.greyDark} />
      {/* cupboard far left (store) */}
      <path d="M560 300 L620 320 V540 L560 580 Z" fill="#cbb89a" />
      {/* lights */}
      <path d="M700 60 h200 l-20 14 h-160z" fill="#fffbe6" />
      <path d="M760 200 h80 l-8 6 h-64z" fill="#fffbe6" />
    </>
  );
}

function Pantry() {
  return (
    <>
      <rect width="1600" height="900" fill="#f1ead9" />
      <rect y="640" width="1600" height="260" fill="#c9c2b5" />
      {/* tiles */}
      {Array.from({ length: 16 }).map((_, i) => (
        <path key={i} d={`M${i * 100} 640 V900`} stroke="#bdb5a7" strokeWidth="2" />
      ))}
      {/* counter */}
      <rect x="60" y="430" width="1000" height="210" fill="#d7c7a8" />
      <rect x="40" y="410" width="1040" height="30" fill="#9b8b6d" />
      {/* sink on the left */}
      <rect x="140" y="412" width="260" height="26" rx="6" fill="#aab3b8" />
      <path d="M260 412 V350 h50 v18" stroke="#8c979d" strokeWidth="10" fill="none" strokeLinecap="round" />
      {/* wet, shiny floor in front of the sink */}
      <ellipse cx="300" cy="760" rx="260" ry="55" fill="#e3eef3" opacity="0.85" />
      <path d="M170 750 q40 -12 80 0 M330 775 q40 -10 90 0" stroke="white" strokeWidth="6" opacity="0.9" fill="none" strokeLinecap="round" />
      {/* water dispenser in the middle */}
      <rect x="700" y="170" width="150" height="240" rx="10" fill="#e9eef1" stroke="#9aa6ad" strokeWidth="4" />
      <rect x="725" y="80" width="100" height="100" rx="30" fill="#b9dcef" opacity="0.9" />
      <rect x="732" y="300" width="18" height="34" rx="4" fill={P.red} />
      <rect x="800" y="300" width="18" height="34" rx="4" fill="#2f6fb5" />
      <rect x="718" y="350" width="114" height="10" fill="#9aa6ad" />
      {/* kettle */}
      <path d="M520 412 q-10 -60 40 -64 q50 4 40 64z" fill="#4d5a63" />
      <path d="M600 370 q30 0 24 30" stroke="#4d5a63" strokeWidth="8" fill="none" />
      {/* first-aid box on the right wall */}
      <rect x="1240" y="230" width="170" height="160" rx="10" fill={P.white} stroke="#cfcfcf" strokeWidth="4" />
      <rect x="1250" y="240" width="150" height="16" fill="#e8e8e8" />
      {/* cupboard */}
      <rect x="980" y="120" width="160" height="200" fill="#c7b391" stroke="#9b8b6d" strokeWidth="4" />
    </>
  );
}

function MeetingRoom() {
  return (
    <>
      <rect width="1600" height="900" fill="#ece5d6" />
      <rect y="620" width="1600" height="280" fill="#b8ab97" />
      {/* whiteboard */}
      <rect x="140" y="160" width="360" height="220" fill="white" stroke="#9aa" strokeWidth="6" />
      {/* back door */}
      <rect x="690" y="200" width="220" height="420" fill="#d24a3a" stroke="#8b2e24" strokeWidth="8" />
      <rect x="700" y="330" width="200" height="10" fill="#8b2e24" opacity="0.4" />
      <rect x="860" y="430" width="34" height="12" rx="5" fill="#c9a43a" />
      {/* water dispenser in the corner, extension cord on the floor */}
      <rect x="1360" y="330" width="110" height="290" rx="8" fill="#e9eef1" stroke="#9aa6ad" strokeWidth="4" />
      <rect x="1375" y="250" width="80" height="90" rx="26" fill="#b9dcef" />
      <path d="M1360 600 C1300 640 1200 610 1180 660 S1100 700 1060 680" stroke="#333" strokeWidth="6" fill="none" />
      <rect x="1030" y="668" width="44" height="22" rx="4" fill="#f2f2f2" stroke="#666" strokeWidth="2" />
      {/* fire extinguisher standing in front of the fire door */}
      <rect x="760" y="560" width="34" height="80" rx="12" fill={P.red} />
      <rect x="769" y="544" width="16" height="18" fill="#333" />
      {/* long table with chairs */}
      <path d="M260 700 H1340 L1260 640 H340 Z" fill={P.wood} />
      <rect x="260" y="700" width="1080" height="20" fill={P.woodDark} />
      {[380, 520, 660, 940, 1080, 1220].map((x) => (
        <g key={x}>
          <rect x={x} y="590" width="70" height="50" rx="10" fill="#6c8aa6" />
          <rect x={x + 10} y="720" width="50" height="90" fill="#6c8aa6" opacity="0.9" />
        </g>
      ))}
    </>
  );
}

export function SceneArt({ place, withPic }: { place: PlaceId; withPic?: "stand" | "point" | false }) {
  return (
    <svg viewBox="0 0 1600 900" className="absolute inset-0 h-full w-full" aria-hidden preserveAspectRatio="xMidYMid slice">
      {place === "entrance" && <Entrance withPic={withPic} />}
      {place === "corridor" && <Corridor />}
      {place === "pantry" && <Pantry />}
      {place === "meeting" && <MeetingRoom />}
    </svg>
  );
}

/** Sign positions in % of the 16:9 picture, from the Stage 1.2 Visuals box. */
export const HOTSPOTS: Record<string, { left: number; top: number; width: number }> = {
  "no-smoking": { left: 53, top: 36, width: 6.5 }, // glass door, right half, eye level
  "assembly-point": { left: 38.5, top: 26, width: 8 }, // outside wall through the glass, left side
  "no-entry-staff-only": { left: 15.5, top: 24, width: 8 }, // store-room door, top half
  "wear-gloves": { left: 15.5, top: 45, width: 7 }, // same door, under sign 3
  "electrical-hazard": { left: 74.5, top: 33, width: 6 }, // fuse box door
  "fire-extinguisher": { left: 60.1, top: 35, width: 4.8 }, // just above the extinguisher
  "wash-hands": { left: 14.5, top: 17, width: 7.5 }, // wall above the sink
  "hot-water": { left: 44.2, top: 23, width: 3.8 }, // sticker on dispenser next to red tap
  "wet-floor": { left: 16, top: 67, width: 7.5 }, // stand on the floor in front of the sink
  "first-aid": { left: 79.5, top: 29, width: 7 }, // front of the first-aid box
  "fire-exit": { left: 44, top: 3, width: 12 }, // high on the wall, above the back door
  "keep-fire-door-shut": { left: 47, top: 36, width: 6 }, // on the back door at eye level
};

export const SCENE_IMAGE: Record<PlaceId, string> = {
  entrance: "M2_S01_02_IMG_01_entrance.webp",
  corridor: "M2_S01_02_IMG_02_corridor.webp",
  pantry: "M2_S01_02_IMG_03_pantry.webp",
  meeting: "M2_S01_02_IMG_04_meeting-room.webp",
};
