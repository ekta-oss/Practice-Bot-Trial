"use client";

import { ExternalIcon } from "./ui";

/**
 * Opens an outside article in a new tab (link-out only; nothing is copied into
 * the course). Returns false if the browser blocked the new tab, so the stage
 * can show its backup card.
 */
export function openArticle(url: string): boolean {
  const w = window.open(url, "_blank");
  if (!w) return false;
  try {
    w.opener = null;
  } catch {}
  return true;
}

export function OpenArticleButton({ label, url, onOpened, onBlocked }: { label: string; url: string; onOpened: () => void; onBlocked: () => void }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => {
        e.preventDefault();
        if (openArticle(url)) onOpened();
        else onBlocked();
      }}
      className="btn-main !text-2xl"
      data-testid="open-article"
    >
      {label} <ExternalIcon />
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}
