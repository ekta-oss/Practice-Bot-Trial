"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Optional Supabase sync of stage completion only.
 *
 * The script keeps everything else on the device:
 *  - practice recordings: "stored locally for self-review only"
 *  - 'My signs': "Stored locally for this module only"
 *  - quiz/guess answers: "not stored"
 * so the only thing sent is which stage was completed and when.
 *
 * Active only when NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
 * are set. Uses anonymous sign-in; rows are protected by RLS
 * (supabase/migrations/0001_stage_progress.sql).
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;
let signedIn: Promise<string | null> | null = null;

export const syncEnabled = Boolean(url && anonKey);

function getClient() {
  if (!syncEnabled) return null;
  if (!client) client = createClient(url!, anonKey!);
  return client;
}

async function ensureUser(): Promise<string | null> {
  const c = getClient();
  if (!c) return null;
  if (!signedIn) {
    signedIn = (async () => {
      const { data } = await c.auth.getSession();
      if (data.session) return data.session.user.id;
      const res = await c.auth.signInAnonymously();
      if (res.error) {
        console.warn("[sync] anonymous sign-in failed:", res.error.message);
        signedIn = null;
        return null;
      }
      return res.data.user?.id ?? null;
    })();
  }
  return signedIn;
}

export async function syncStageComplete(stageId: string) {
  const c = getClient();
  if (!c) return;
  try {
    const userId = await ensureUser();
    if (!userId) return;
    const { error } = await c
      .from("stage_progress")
      .upsert({ user_id: userId, module: "M2", stage_id: stageId, completed_at: new Date().toISOString() }, { onConflict: "user_id,module,stage_id" });
    if (error) console.warn("[sync] upsert failed:", error.message);
  } catch (e) {
    console.warn("[sync] failed", e);
  }
}
