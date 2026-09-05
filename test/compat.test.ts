import { test } from "node:test";
import assert from "node:assert/strict";
import { restoreProtectedCaptions } from "../src/compat";
test("restore the existing Image Captions bracket protection", () => {
  const caption = "外観 [メモ]";
  const source = `![[a.jpg|__QIC_CAPTION_${Buffer.from(caption).toString("base64url")}_END__]]`;
  assert.equal(restoreProtectedCaptions(source), `![[a.jpg|${caption}]]`);
  assert.equal(restoreProtectedCaptions("![[a.jpg|外観]]"), "![[a.jpg|外観]]");
});
