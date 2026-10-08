"use client";

/**
 * Practice recordings live only in this browser (IndexedDB).
 * Script: "Recording stored locally for self-review only (Practice badge)."
 * Nothing here is uploaded.
 */

export interface StoredRecording {
  key: string; // `${stageId}:${slot}`
  stageId: string;
  slot: string;
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

export async function saveRecording(rec: Omit<StoredRecording, "key" | "savedAt">) {
  const value: StoredRecording = { ...rec, key: `${rec.stageId}:${rec.slot}`, savedAt: Date.now() };
  await tx("readwrite", (s) => s.put(value));
  window.dispatchEvent(new CustomEvent("m2s1-recordings-changed"));
  return value;
}

export function listRecordings(): Promise<StoredRecording[]> {
  return tx("readonly", (s) => s.getAll() as IDBRequest<StoredRecording[]>);
}

export async function clearRecordings() {
  await tx("readwrite", (s) => s.clear());
  window.dispatchEvent(new CustomEvent("m2s1-recordings-changed"));
}
