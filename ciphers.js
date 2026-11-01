// Pure cipher helpers. Loaded as a classic script in the browser and
// required directly by the Node tests.
const ABC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function encode(text, cipher, shift = 3) {
  return text.replace(/[A-Z]/g, (ch) => {
    const n = ABC.indexOf(ch);
    return ABC[cipher === "atbash" ? 25 - n : (n + shift) % 26];
  });
}

function decode(text, cipher, shift = 3) {
  return cipher === "atbash" ? encode(text, "atbash") : encode(text, "caesar", 26 - (shift % 26));
}

// Strip everything except letters and digits so spacing and punctuation never cost a point.
function normal(text) {
  return text.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

// How many characters of the guess are in the right place.
function lettersRight(guess, answer) {
  const g = normal(guess);
  const a = normal(answer);
  let right = 0;
  for (let i = 0; i < a.length; i++) if (g[i] === a[i]) right++;
  return right;
}

// Pigpen: A–I plain grid, J–R dotted grid, S–V plain X, W–Z dotted X.
function pig(ch) {
  let n = ABC.indexOf(ch);
  if (n < 0) return "";
  let d = "";
  let dot = false;
  if (n < 18) {
    dot = n >= 9;
    n %= 9;
    const row = Math.floor(n / 3);
    const col = n % 3;
    if (row > 0) d += "M3 3H25 ";
    if (row < 2) d += "M3 25H25 ";
    if (col > 0) d += "M3 3V25 ";
    if (col < 2) d += "M25 3V25 ";
  } else {
    dot = n >= 22;
    // top (V), left (>), right (<), bottom (^)
    d = ["M3 3L14 25L25 3", "M3 3L25 14L3 25", "M25 3L3 14L25 25", "M3 25L14 3L25 25"][
      (n - 18) % 4
    ];
  }
  return `<svg viewBox="0 0 28 28" aria-hidden="true"><path d="${d}" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>${
    dot ? '<circle cx="14" cy="14" r="2.3" fill="currentColor"/>' : ""
  }</svg>`;
}

if (typeof module !== "undefined")
  module.exports = { ABC, encode, decode, normal, lettersRight, pig };
