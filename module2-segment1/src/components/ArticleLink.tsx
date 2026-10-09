"use client";

import { ExternalIcon } from "./ui";

/**
 * Opens an outside article in a new tab (link-out only; nothing is copied into
 * the course). A real link, so it also works where pop-up windows are not
 * allowed (for example a Claude-hosted page). If the article does not open,
 * the stage offers its backup card through "The article did not open".
 */
export function OpenArticleButton({ label, url, onOpened }: { label: string; url: string; onOpened: () => void }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" onClick={onOpened} className="btn-main !text-2xl" data-testid="open-article">
      {label} <ExternalIcon />
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}
