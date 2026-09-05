/** Undo the existing Image Captions text hook's bracket escaping inside our fence.
 * It currently scans code blocks too. No dependency on that plugin is required.
 */
export function restoreProtectedCaptions(source: string): string {
  return source.replace(/\|__QIC_CAPTION_([A-Za-z0-9_-]+)_END__\]\]/g, (original, encoded: string) => {
    const caption = Buffer.from(encoded, "base64url").toString("utf8");
    if (Buffer.from(caption).toString("base64url") !== encoded || !/[\[\]]/.test(caption)) return original;
    return `|${caption}]]`;
  });
}
