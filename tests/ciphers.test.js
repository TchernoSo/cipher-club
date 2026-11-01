const test = require("node:test");
const assert = require("node:assert");
const { ABC, encode, decode, normal, lettersRight, pig } = require("../ciphers.js");

test("caesar shifts letters and wraps around", () => {
  assert.strictEqual(encode("HELLO", "caesar", 3), "KHOOR");
  assert.strictEqual(encode("XYZ", "caesar", 3), "ABC");
  assert.strictEqual(encode("HI THERE!", "caesar", 1), "IJ UIFSF!");
});

test("decode undoes encode for every shift", () => {
  for (let k = 1; k < 26; k++) assert.strictEqual(decode(encode(ABC, "caesar", k), "caesar", k), ABC);
  assert.strictEqual(decode(encode(ABC, "atbash"), "atbash"), ABC);
});

test("atbash mirrors the alphabet", () => {
  assert.strictEqual(encode("ABC XYZ", "atbash"), "ZYX CBA");
});

test("answers ignore spaces and punctuation", () => {
  assert.strictEqual(normal("Meet at the tree!"), normal("MEETATTHETREE"));
  assert.strictEqual(lettersRight("meet at the trex", "MEET AT THE TREE"), 12);
});

test("pigpen gives every letter a unique symbol", () => {
  const symbols = new Set([...ABC].map(pig));
  assert.strictEqual(symbols.size, 26);
  assert.strictEqual(pig("1"), "");
});
