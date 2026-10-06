import { expect, it } from "vitest";
import { createHash } from "./hash.ts";

// Fixed vectors checked independently with Python's hashlib.sha1 over UTF-8.
it.each([
  ["empty input", "", "DA39A3EE5E6B4B0D3255BFEF95601890AFD80709"],
  ["ASCII", "abc", "A9993E364706816ABA3E25717850C26C9CD0D89D"],
  ["password", "h3770_w0rld", "80452C69099DAA225E4B202EBCDA64C59F54FCC9"],
  [
    "multiple SHA-1 blocks",
    "abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq",
    "84983E441C3BD26EBAAE4AA1F95129E5E54670F1",
  ],
  ["UTF-8 accents", "pässwörd", "F517DDF1D32A112FF1AD55C66D1B12CB38E7E8F7"],
  [
    "emoji and leading zero bytes",
    "🔐",
    "0E524B4DA8A9E64C1380ACAAAF3CB03FAC830CDB",
  ],
  ["composed Unicode", "é", "BF15BE717AC1B080B4F1C456692825891FF5073D"],
  ["decomposed Unicode", "e\u0301", "7E3FBCF1B6A69221CD8EEF7442EF3B51A253BB49"],
  [
    "surrounding whitespace",
    " password ",
    "E6EE5DBAB4167ECE69097D192D7EE8B3B5AA5292",
  ],
  ["embedded NUL", "pass\0word", "726CCDBD77CC9BB88DB6CC320E5326531304E721"],
])(
  "hashes %s to uppercase, zero-padded SHA-1",
  async (_name, input, expected) => {
    await expect(createHash(input)).resolves.toBe(expected);
  },
);
