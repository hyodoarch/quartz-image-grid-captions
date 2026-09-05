import { errorText, type Grid } from "./parser";
import { calculateLayout } from "./layout";

export function showError(element: HTMLElement, error: unknown) {
  element.className = "image-grid-captions__error";
  element.setAttribute("role", "alert");
  element.textContent = errorText(error);
}

export function renderGrid(host: HTMLElement, grid: Grid, sources: string[]): HTMLElement {
  const doc = host.ownerDocument;
  const row = doc.createElement("div");
  row.className = "image-grid-captions";
  row.dataset.columns = String(grid.columns);
  row.dataset.gap = String(grid.gap);
  grid.images.forEach((item, index) => {
    const figure = doc.createElement("figure");
    figure.className = "image-grid-captions__item";
    const img = doc.createElement("img");
    img.className = "image-grid-captions__image";
    img.alt = item.alt;
    img.dataset.imagePath = item.path;
    img.src = sources[index];
    figure.append(img);
    if (item.caption) {
      const caption = doc.createElement("figcaption");
      caption.className = "image-grid-captions__caption";
      caption.textContent = item.caption;
      figure.append(caption);
    }
    row.append(figure);
  });
  host.replaceChildren(row);
  return row;
}

/** Uses the owning window, including Obsidian pop-out windows. Returns teardown. */
export function mountGrid(row: HTMLElement): () => void {
  const win = row.ownerDocument.defaultView!;
  const images = Array.from(row.querySelectorAll<HTMLImageElement>(".image-grid-captions__image"));
  const figures = images.map(img => img.parentElement!);
  const message = row.ownerDocument.createElement("div");
  message.className = "image-grid-captions__error";
  message.setAttribute("role", "alert");
  message.hidden = true;
  row.append(message);
  let disposed = false;
  let failed = false;
  const gap = Number(row.dataset.gap);
  const update = () => {
    if (disposed || failed || images.some(img => !img.complete || !img.naturalWidth || !img.naturalHeight)) return;
    const width = row.getBoundingClientRect().width;
    if (width <= 0) return; // Hidden panes will be retried by ResizeObserver.
    try {
      const layout = calculateLayout(width, gap, images.map(img => img.naturalWidth / img.naturalHeight));
      message.hidden = true;
      row.style.gap = `${gap}px`;
      figures.forEach((figure, i) => {
        figure.hidden = false;
        figure.style.width = `${layout.widths[i]}px`;
        images[i].style.height = `${layout.height}px`;
      });
      row.dataset.ready = "true";
    } catch (error) {
      figures.forEach(figure => { figure.hidden = true; });
      message.hidden = false;
      message.textContent = errorText(error);
    }
  };
  const onError = (event: Event) => {
    if (disposed || failed) return;
    failed = true;
    const img = event.target as HTMLImageElement;
    showError(row, new Error(`Image not found or unreadable: ${img.dataset.imagePath}`));
    observer.disconnect();
  };
  const observer = new win.ResizeObserver(update);
  images.forEach(img => {
    img.addEventListener("load", update);
    img.addEventListener("error", onError);
  });
  observer.observe(row);
  for (const img of images) {
    if (img.complete && !img.naturalWidth) onError({ target: img } as unknown as Event);
  }
  update();
  return () => {
    disposed = true;
    observer.disconnect();
    images.forEach(img => {
      img.removeEventListener("load", update);
      img.removeEventListener("error", onError);
    });
  };
}
