import { mountGrid } from "./shared/renderer";

// One observer also covers Quartz popovers/transclusions added after SPA navigation.
const active = new Map<HTMLElement, () => void>();
function scan() {
  for (const [row, cleanup] of active) {
    if (!row.isConnected) { cleanup(); active.delete(row); }
  }
  document.querySelectorAll<HTMLElement>(".image-grid-captions").forEach(row => {
    if (!active.has(row)) active.set(row, mountGrid(row));
  });
}
const observer = new MutationObserver(scan);
observer.observe(document.documentElement, { childList: true, subtree: true });
document.addEventListener("nav", scan);
scan();
