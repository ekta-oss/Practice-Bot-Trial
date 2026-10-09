"use client";

/**
 * Helpers for running both as a normal website and as a Claude-hosted page.
 * A Claude-hosted page ignores <a download> links, so files are offered
 * through its `downloads` capability when it is there.
 */

type Saver = { save: (r: { filename: string; data: Blob }) => Promise<unknown> };
type ClaudeHost = { use?: (name: string) => Promise<unknown> };

let saverPromise: Promise<Saver | null> | null = null;

function hostSaver(): Promise<Saver | null> {
  if (!saverPromise) {
    const c = (typeof window !== "undefined" ? (window as unknown as { claude?: ClaudeHost }).claude : undefined) ?? null;
    saverPromise = c?.use ? (c.use("downloads") as Promise<Saver | null>).catch(() => null) : Promise.resolve(null);
  }
  return saverPromise;
}

/** Offers a file to the learner. Resolves false if they declined or saving is not possible. */
export async function saveFile(blob: Blob, filename: string): Promise<boolean> {
  const saver = await hostSaver();
  if (saver) {
    try {
      await saver.save({ filename, data: blob });
      return true;
    } catch {
      return false;
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return true;
}
