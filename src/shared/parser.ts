export interface GridImage { path: string; caption: string; alt: string }
export interface Grid { columns: 2 | 3 | 4; gap: number; images: GridImage[] }
export const LANGUAGE = "image-grid-captions";
export const PREFIX = "Image Grid Captions Error:\n";
export function errorText(error: unknown): string {
  return PREFIX + (error instanceof Error ? error.message : String(error));
}

/** One embed per line. Captions are plain text, never HTML or size directives. */
export function parseGrid(source: string): Grid {
  const params = new Map<string, string>();
  const images: GridImage[] = [];
  for (const raw of source.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("![[") && line.endsWith("]]")) {
      const parts = line.slice(3, -2).split("|");
      if (parts.length > 2) throw new Error("Additional image parameters are not supported.");
      const path = parts[0].trim();
      const caption = parts[1]?.trim() ?? "";
      if (!path || /[:#?\[\]\\]/.test(path) || path.startsWith("/") || !/\.(png|jpe?g|webp|gif|bmp|avif|svg)$/i.test(path)) {
        throw new Error(`Unsupported local image path: ${path}`);
      }
      images.push({ path, caption, alt: caption || path.split("/").pop()! });
      continue;
    }
    const colon = line.indexOf(":");
    if (colon < 0) throw new Error(`Invalid line: ${line}`);
    const key = line.slice(0, colon).trim();
    if (key !== "columns" && key !== "gap") throw new Error(`Unknown parameter: ${key}`);
    if (params.has(key)) throw new Error(`Duplicate parameter: ${key}`);
    params.set(key, line.slice(colon + 1).trim());
  }
  if (!params.has("columns")) throw new Error("columns is required.");
  const columns = params.get("columns")!;
  if (!/^[234]$/.test(columns)) throw new Error("columns must be 2, 3, or 4.");
  const gap = params.get("gap") ?? "8";
  if (!/^\d+$/.test(gap) || !Number.isSafeInteger(Number(gap))) throw new Error("gap must be a non-negative safe integer.");
  if (images.length !== Number(columns)) throw new Error(`columns is ${columns}, but ${images.length} images were found.`);
  return { columns: Number(columns) as Grid["columns"], gap: Number(gap), images };
}
