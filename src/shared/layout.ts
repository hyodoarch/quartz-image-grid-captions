export function calculateLayout(width: number, gap: number, ratios: number[]) {
  if (!Number.isFinite(width) || width < 0 || !Number.isSafeInteger(gap) || gap < 0 || !ratios.length || ratios.some(r => !Number.isFinite(r) || r <= 0)) {
    throw new Error("Invalid layout dimensions.");
  }
  const available = width - gap * (ratios.length - 1);
  if (available <= 0) throw new Error("Container is too narrow for the specified gap.");
  const height = available / ratios.reduce((a, b) => a + b, 0);
  return { height, widths: ratios.map(r => height * r) };
}
