"use client";

import { ExternalIcon } from "./ui";

/**
 * Opens an outside article in a new tab (link-out only; nothing is copied into
 * the course). A real link, so it also works where pop-up windows are not
 * allowed (for example a Claude-hosted page). If the article does not open,
 * the stage offers its backup card through "The article did not open".
 */
/** `primary`: amber until the article is opened; then "Back to the course" becomes the primary action. */
export function OpenArticleButton({ label, url, onOpened, primary = true }: { label: string; url: string; onOpened: () => void; primary?: boolean }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" onClick={onOpened} className={primary ? "btn-main !text-xl" : "btn-secondary"} data-testid="open-article">
      {label} <ExternalIcon />
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}
