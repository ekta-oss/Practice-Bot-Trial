"use client";

import { useEffect, useState } from "react";
import { ASSETS } from "@/content/assets";
import { assetExists } from "@/lib/media";

/** Team page: which produced media files are in public/media right now. */
export function AssetStatus() {
  const [found, setFound] = useState<Record<string, boolean>>({});
  useEffect(() => {
    ASSETS.forEach((a) => {
      void assetExists(`/media/${a.dir}/${a.file}`).then((ok) => setFound((f) => ({ ...f, [a.file]: ok })));
    });
  }, []);
  const present = ASSETS.filter((a) => found[a.file]).length;
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-2 text-3xl font-bold">Asset status — Stages 1.1–1.6</h1>
      <p className="mb-6 text-lg text-slate-700" data-testid="asset-summary">
        {present} of {ASSETS.length} files present in <code>public/media</code>. Missing files are never shown as finished: the course marks them on screen.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-base">
          <thead>
            <tr className="border-b-2 border-slate-300">
              <th className="p-2">Stage</th>
              <th className="p-2">File</th>
              <th className="p-2">What</th>
              <th className="p-2">Status</th>
              <th className="p-2">While missing</th>
            </tr>
          </thead>
          <tbody>
            {ASSETS.map((a) => (
              <tr key={a.file} className="border-b border-slate-200 align-top">
                <td className="p-2">{a.stage}</td>
                <td className="p-2 font-mono text-sm">
                  media/{a.dir}/{a.file}
                  {!a.namedInScript && <div className="text-xs text-amber-800">name chosen by build</div>}
                </td>
                <td className="p-2">{a.what}</td>
                <td className="p-2 font-semibold">
                  {found[a.file] === undefined ? "…" : found[a.file] ? <span className="text-emerald-700">Present</span> : <span className="text-fuchsia-700">Missing</span>}
                  {!a.required && <div className="text-xs font-normal text-slate-600">optional</div>}
                </td>
                <td className="p-2 text-sm text-slate-700">{a.fallback}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
