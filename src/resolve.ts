import { resolveRelative, transformLink } from "@quartz-community/utils/path";
import type { FullSlug } from "@quartz-community/types";

/** Delegate slug encoding, nested paths and basename matching to Quartz. */
export function resolveImage(source: FullSlug, target: string, allSlugs: FullSlug[]): string {
  const src = transformLink(source, target, { strategy: "shortest", allSlugs });
  const effectiveSource = !source.endsWith("index") && allSlugs.includes(`${source}/index` as FullSlug)
    ? `${source}/index` as FullSlug : source;
  const canonical = (value: string) => new URL(value, "https://quartz.invalid/").pathname;
  const exists = allSlugs.some(slug => canonical(resolveRelative(effectiveSource, slug)) === canonical(src));
  if (!exists) throw new Error(`Image not found: ${target}`);
  return src;
}
