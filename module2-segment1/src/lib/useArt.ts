"use client";

import { useEffect, useState } from "react";
import { IMAGE_DIR, assetExists } from "./media";

/** The illustrator's image `file` in media/images, or null while it is missing ("" = none). */
export function useArt(file: string): string | null {
  const [img, setImg] = useState<{ file: string; src: string | null } | null>(null);
  useEffect(() => {
    if (!file) return;
    let live = true;
    void assetExists(IMAGE_DIR + file).then((ok) => live && setImg({ file, src: ok ? IMAGE_DIR + file : null }));
    return () => {
      live = false;
    };
  }, [file]);
  return file && img && img.file === file ? img.src : null;
}
