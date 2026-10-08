import type { SignDef, SignShape, SignSymbol } from "@/content/segment1";

/**
 * Safety signs drawn in code (ISO 7010 shapes and colours — Visual & Context
 * Reference A, "Sign icons"): red circle with a bar = do not; yellow triangle =
 * be careful; blue circle = you must; green square = safe way; red square =
 * fire equipment. Each sign has its word on it.
 *
 * INTERIM ART: these pictograms are build-drawn; the illustration team may
 * replace them (see docs/ASSET_MANIFEST.md).
 */

const C = {
  red: "#C8102E",
  yellow: "#F6C700",
  blue: "#0057A8",
  green: "#00843D",
  black: "#111111",
};

function Symbol({ symbol, ink }: { symbol: SignSymbol; ink: string }) {
  const s = { fill: ink, stroke: ink } as const;
  switch (symbol) {
    case "cigarette":
      return (
        <g>
          <rect x="22" y="52" width="46" height="9" fill={ink} />
          <rect x="70" y="52" width="8" height="9" fill={ink} />
          <path d="M74 46c-4-5 4-8 0-14M64 46c-4-5 4-8 0-14" fill="none" stroke={ink} strokeWidth="3" strokeLinecap="round" />
        </g>
      );
    case "assembly":
      return (
        <g {...s}>
          {[30, 48, 66].map((x) => (
            <g key={x}>
              <circle cx={x} cy="30" r="6" stroke="none" />
              <path d={`M${x - 7} 62v-18a7 7 0 0 1 14 0v18z`} stroke="none" />
            </g>
          ))}
          <path d="M28 80h44M28 80l9-7M28 80l9 7" fill="none" strokeWidth="5" strokeLinecap="round" />
        </g>
      );
    case "person":
      return (
        <g fill={ink}>
          <circle cx="50" cy="26" r="8" />
          <path d="M40 38h20l-3 26h-4l-1 20h-4l-1-20h-4z" />
        </g>
      );
    case "gloves":
      return (
        <g fill={ink}>
          <rect x="33" y="44" width="34" height="34" rx="8" />
          <rect x="34" y="22" width="7" height="28" rx="3.5" />
          <rect x="43" y="17" width="7" height="30" rx="3.5" />
          <rect x="52" y="19" width="7" height="30" rx="3.5" />
          <rect x="61" y="25" width="6.5" height="24" rx="3.2" />
          <rect x="22" y="44" width="8" height="20" rx="4" transform="rotate(-30 26 54)" />
          <rect x="35" y="78" width="30" height="8" />
        </g>
      );
    case "lightning":
      return <path d="M55 18L33 56h15l-6 28 25-40H52z" fill={ink} />;
    case "extinguisher":
      return (
        <g fill={ink}>
          <rect x="38" y="34" width="22" height="50" rx="7" />
          <rect x="44" y="24" width="10" height="10" />
          <path d="M54 26h14l6 8" fill="none" stroke={ink} strokeWidth="4" strokeLinecap="round" />
          <path d="M38 40c-8 4-10 14-6 24" fill="none" stroke={ink} strokeWidth="3.5" />
        </g>
      );
    case "handwash":
      return (
        <g fill={ink}>
          <path d="M30 20h30v8H48v6h-6v-6H30z" />
          <circle cx="45" cy="42" r="2.5" />
          <circle cx="45" cy="50" r="2.5" />
          <path d="M22 72c6-12 16-14 24-10l-4 6 10 4c-6 10-22 12-30 0z" />
          <path d="M78 72c-6-12-16-14-24-10l4 6-10 4c6 10 22 12 30 0z" />
        </g>
      );
    case "hotwater":
      return (
        <g fill={ink}>
          <path d="M26 30h34v9H48v8h-8v-8H26z" />
          <path d="M44 56c-6 8-6 14 0 18 6-4 6-10 0-18z" />
          <path d="M62 50c3-4-3-6 0-10M70 54c3-4-3-6 0-10" fill="none" stroke={ink} strokeWidth="3" strokeLinecap="round" />
        </g>
      );
    case "slip":
      return (
        <g fill={ink}>
          <circle cx="60" cy="30" r="6" />
          <path d="M56 38l-14 14 6 4 10-8 6 12-16 10 4 5 20-12-8-20z" />
          <path d="M28 82h46" stroke={ink} strokeWidth="4" strokeLinecap="round" />
          <path d="M30 76c4-3 8-3 12 0" fill="none" stroke={ink} strokeWidth="3" />
        </g>
      );
    case "cross":
      return <path d="M42 22h16v20h20v16H58v20H42V58H22V42h20z" fill={ink} />;
    case "runExit":
      return (
        <g fill={ink}>
          <rect x="62" y="20" width="22" height="60" fill="none" stroke={ink} strokeWidth="4" />
          <circle cx="44" cy="26" r="6" />
          <path d="M40 34l-12 8 3 4 9-5 2 14-12 14 5 4 12-13 8 12 6-3-9-15-1-13 8 6h10v-6h-8z" />
        </g>
      );
    case "door":
      return (
        <g fill="none" stroke={ink} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="32" y="20" width="36" height="62" />
          <circle cx="60" cy="52" r="2.5" fill={ink} />
          <path d="M20 40a26 26 0 0 0 0 26M20 66l-5-6M20 66l7-3" strokeWidth="4" />
        </g>
      );
    case "goggles":
      return (
        <g fill={ink}>
          <circle cx="50" cy="40" r="22" />
          <rect x="24" y="36" width="52" height="16" rx="8" fill={C.blue} stroke={ink} strokeWidth="0" />
          <rect x="28" y="38" width="44" height="12" rx="6" fill={ink} />
          <circle cx="40" cy="44" r="4" fill={C.blue} />
          <circle cx="60" cy="44" r="4" fill={C.blue} />
          <path d="M34 66h32l-4 16H38z" />
        </g>
      );
    case "hardhat":
      return (
        <g fill={ink}>
          <path d="M24 60a26 26 0 0 1 52 0z" />
          <rect x="18" y="60" width="64" height="8" rx="3" />
          <rect x="46" y="30" width="8" height="30" fill={C.blue} />
          <path d="M36 72h28l-3 12H39z" />
        </g>
      );
    case "forklift":
      return (
        <g fill={ink}>
          <rect x="26" y="44" width="30" height="22" />
          <path d="M32 44V30h16l6 14z" fill="none" stroke={ink} strokeWidth="4" />
          <rect x="60" y="22" width="5" height="46" />
          <rect x="65" y="62" width="16" height="5" />
          <circle cx="33" cy="70" r="7" />
          <circle cx="52" cy="70" r="7" />
        </g>
      );
    case "alarm":
      return (
        <g fill={ink}>
          <path d="M50 22a18 18 0 0 1 18 18v18l6 8H26l6-8V40a18 18 0 0 1 18-18z" />
          <circle cx="50" cy="74" r="6" />
          <path d="M22 30l-6-6M78 30l6-6" stroke={ink} strokeWidth="4" strokeLinecap="round" />
        </g>
      );
    default:
      return null;
  }
}

function Pictogram({ shape, symbol }: { shape: SignShape; symbol: SignSymbol }) {
  if (shape === "prohibition" && symbol === "bar") {
    return (
      <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden>
        <circle cx="50" cy="50" r="46" fill={C.red} />
        <rect x="18" y="40" width="64" height="20" fill="white" />
      </svg>
    );
  }
  switch (shape) {
    case "prohibition":
      return (
        <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden>
          <circle cx="50" cy="50" r="46" fill="white" />
          <g transform="translate(14 14) scale(0.72)">
            <Symbol symbol={symbol} ink={C.black} />
          </g>
          <circle cx="50" cy="50" r="41" fill="none" stroke={C.red} strokeWidth="10" />
          <path d="M21 21L79 79" stroke={C.red} strokeWidth="10" />
        </svg>
      );
    case "warning":
    case "floorStand":
      return (
        <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden>
          <path d="M50 6L96 90H4z" fill={C.yellow} stroke={C.black} strokeWidth="7" strokeLinejoin="round" />
          <g transform="translate(25 38) scale(0.5)">
            <Symbol symbol={symbol} ink={C.black} />
          </g>
        </svg>
      );
    case "mandatory":
      return (
        <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden>
          <circle cx="50" cy="50" r="46" fill={C.blue} />
          <g transform="translate(12 12) scale(0.76)">
            <Symbol symbol={symbol} ink="white" />
          </g>
        </svg>
      );
    case "safe":
    case "fire":
      return (
        <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden>
          <rect x="2" y="2" width="96" height="96" rx="4" fill={shape === "safe" ? C.green : C.red} />
          <g transform="translate(10 8) scale(0.8)">
            <Symbol symbol={symbol} ink="white" />
          </g>
        </svg>
      );
  }
}

/**
 * A full sign plate: pictogram + the sign's word(s).
 * `size` is the plate width in px (or "fill" to fill the parent).
 */
export function SignIcon({ sign, size = 120, className = "" }: { sign: SignDef; size?: number | "fill"; className?: string }) {
  const isColouredPlate = sign.shape === "safe" || sign.shape === "fire";
  const plateBg = isColouredPlate ? (sign.shape === "safe" ? C.green : C.red) : sign.shape === "floorStand" ? C.yellow : "white";
  const textColor = isColouredPlate ? "white" : C.black;
  const style = size === "fill" ? { width: "100%" } : { width: size };
  const fontPx = size === "fill" ? undefined : Math.max(9, Math.round(size * 0.115));
  const arrow = sign.arrow;
  return (
    <div
      className={`flex flex-col items-center rounded-[6%] shadow-[0_1px_3px_rgba(0,0,0,0.35)] ${sign.shape === "floorStand" ? "rounded-t-[30%] border-x-[3px] border-b-[3px] border-black" : ""} ${className}`}
      style={{ ...style, background: plateBg, padding: "6% 6% 5%", containerType: "inline-size" }}
      role="img"
      aria-label={`${sign.word} sign`}
      data-sign={sign.id}
    >
      <div className="flex w-full items-center justify-center gap-[4%]">
        {arrow === "left" && <Arrow dir="left" color={textColor} />}
        <div className="aspect-square w-[62%]">
          <Pictogram shape={sign.shape} symbol={sign.symbol} />
        </div>
        {arrow === "right" && <Arrow dir="right" color={textColor} />}
      </div>
      <p
        className="mt-[5%] w-full text-center font-extrabold uppercase leading-[1.05] tracking-tight"
        style={{ color: textColor, fontSize: fontPx ?? "12.5cqw" }}
      >
        {sign.word}
      </p>
    </div>
  );
}

function Arrow({ dir, color }: { dir: "left" | "right"; color: string }) {
  return (
    <svg viewBox="0 0 30 30" className="w-[22%]" aria-hidden>
      <path d={dir === "left" ? "M26 15H6M6 15l9-9M6 15l9 9" : "M4 15h20M24 15l-9-9M24 15l-9 9"} stroke={color} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** A plain coloured swatch / shape used by Stage 1.6 guesses and Shape Match. */
export function Swatch({ kind, className = "" }: { kind: "red" | "yellow" | "blue" | "green" | "redSquare"; className?: string }) {
  if (kind === "redSquare")
    return (
      <svg viewBox="0 0 100 100" className={className} role="img" aria-label="A red square sign">
        <rect x="4" y="4" width="92" height="92" rx="4" fill={C.red} />
      </svg>
    );
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label={`The colour ${kind}`}>
      <rect x="4" y="4" width="92" height="92" rx="20" fill={C[kind]} />
    </svg>
  );
}

export function ShapeGlyph({ shape, className = "" }: { shape: "triangle" | "circle" | "square"; className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label={shape === "square" ? "square or rectangle" : shape}>
      {shape === "triangle" && <path d="M50 8L94 88H6z" fill="#475569" />}
      {shape === "circle" && <circle cx="50" cy="50" r="44" fill="#475569" />}
      {shape === "square" && <rect x="8" y="8" width="84" height="84" rx="4" fill="#475569" />}
    </svg>
  );
}

export const SIGN_COLOURS = C;
