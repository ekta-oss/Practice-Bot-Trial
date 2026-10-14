"use client";

/**
 * Practice recordings live only in this browser (IndexedDB).
 * Script: "Recording stored locally for self-review only (Practice badge)."
 * Nothing here is uploaded.
 *
 * Every take is kept — also the ones the learner replaced with "Record again" —
 * so they can listen to earlier takes and compare. The take they chose with
 * "Keep" is marked `kept`.
 */

export interface StoredRecording {
  key: string; // `${stageId}:${slot}:${take}` (older builds: `${stageId}:${slot}`)
  stageId: string;
  slot: string;
  /** 1, 2, 3… within this stage and slot. */
  take: number;
  /** The take the learner kept. */
  kept: boolean;
  blob: Blob;
  mimeType: string;
  durationMs: number;
  savedAt: number;
}

const DB = "m2s1-practice";
const STORE = "recordings";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: "key" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise<T>((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const r = fn(t.objectStore(STORE));
    t.oncomplete = () => {
      db.close();
      resolve(r.result);
    };
    t.onerror = () => {
      db.close();
      reject(t.error);
    };
  });
}

const changed = () => window.dispatchEvent(new CustomEvent("m2s1-recordings-changed"));

/** Saves a new take (numbered after the earlier takes of the same stage and slot). */
export async function saveTake(rec: Omit<StoredRecording, "key" | "savedAt" | "take" | "kept">): Promise<StoredRecording> {
  const earlier = (await listRecordings()).filter((r) => r.stageId === rec.stageId && r.slot === rec.slot);
  const take = earlier.reduce((n, r) => Math.max(n, r.take ?? 1), 0) + 1;
  const value: StoredRecording = { ...rec, take, kept: false, key: `${rec.stageId}:${rec.slot}:${take}`, savedAt: Date.now() };
  await tx("readwrite", (s) => s.put(value));
  changed();
  return value;
}

/** Marks one take as the kept one (the others of its slot stay, unmarked). */
export async function markKept(key: string) {
  const all = await listRecordings();
  const mine = all.find((r) => r.key === key);
  if (!mine) return;
  for (const r of all.filter((x) => x.stageId === mine.stageId && x.slot === mine.slot)) {
    const kept = r.key === key;
    if (r.kept !== kept) await tx("readwrite", (s) => s.put({ ...r, kept }));
  }
  changed();
}

export async function listRecordings(): Promise<StoredRecording[]> {
  const all = await tx("readonly", (s) => s.getAll() as IDBRequest<StoredRecording[]>);
  // Recordings from older builds: one kept take per slot.
  return all.map((r) => ({ ...r, take: r.take ?? 1, kept: r.kept ?? true })).sort((a, b) => a.savedAt - b.savedAt);
}

export async function clearRecordings() {
  await tx("readwrite", (s) => s.clear());
  changed();
}
