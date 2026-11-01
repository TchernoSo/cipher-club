const $ = (id) => document.getElementById(id);

const MISSIONS = [
  "HIDDEN TREASURE",
  "FOLLOW THE CLUES",
  "SECRET AGENT",
  "LOOK UNDER THE MAT",
  "FIND THE GOLD KEY",
  "TRUST YOUR TEAM",
  "THE DRAGON IS ASLEEP",
  "MEET AT THE TREE",
  "THE MAP IS SAFE",
  "OPEN THE BLUE DOOR",
  "THE OWL SEES ALL",
  "CHECK THE BOOKSHELF",
  "PIZZA AT NOON",
  "THE CAT KNOWS",
  "ROBOTS LOVE PUZZLES",
  "WALK TEN STEPS NORTH",
  "THE CAKE IS A CLUE",
  "SEND HELP AND SNACKS",
  "THE PARROT TALKS",
  "WAIT BY THE GATE",
];

let mode = "solo";
let cipher = "caesar";
let round = null;
let tick = null;
let turn = 0;
let scores = [0, 0];
let names = ["Player 1", "Player 2"];
let lastMission = "";

// Total codes cracked survives refreshes; if storage is blocked we just keep it in memory.
let cracked = 0;
try {
  cracked = +localStorage.getItem("cipherClubCracked") || 0;
} catch {}
function saveCracked() {
  try {
    localStorage.setItem("cipherClubCracked", cracked);
  } catch {}
  $("cracked").textContent = cracked
    ? `🏅 ${cracked} code${cracked === 1 ? "" : "s"} cracked so far`
    : "No rush. Help is always here.";
}

function show(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.toggle("hidden", s.id !== id));
  window.scrollTo({ top: 0, behavior: "instant" });
}

function stopRound() {
  clearInterval(tick);
  round = null;
}

for (let i = 1; i < 26; i++) $("shift").add(new Option(i + (i === 1 ? " place" : " places"), i));
$("shift").value = "3";
saveCracked();

$("solo").onclick = () => {
  mode = "solo";
  show("choose");
};
$("friends").onclick = () => {
  mode = "friends";
  show("choose");
};
document.querySelectorAll("[data-back]").forEach((b) => (b.onclick = () => show(b.dataset.back)));

function openSetup() {
  const solo = mode === "solo";
  $("chosen").textContent = cipher.toUpperCase() + " CODE";
  $("messageBox").classList.toggle("hidden", solo);
  $("soloTip").classList.toggle("hidden", !solo);
  $("names").classList.toggle("hidden", solo);
  $("shiftbox").classList.toggle("hidden", cipher !== "caesar");
  $("setupTitle").innerHTML = solo ? "Ready, <em>agent?</em>" : "Make it <em>secret.</em>";
  updateWriter();
  $("create").textContent = solo ? "Start my mission →" : "Seal my message →";
  $("error").textContent = "";
  show("setup");
}

function updateWriter() {
  $("writer").textContent =
    mode === "solo"
      ? ""
      : `${names[turn % 2]}, write a message for ${names[(turn + 1) % 2]} to crack.`;
}

document.querySelectorAll("[data-c]").forEach(
  (b) =>
    (b.onclick = () => {
      cipher = b.dataset.c;
      openSetup();
    }),
);

["p1", "p2"].forEach(
  (id, i) =>
    ($(id).oninput = () => {
      names[i] = $(id).value.trim() || `Player ${i + 1}`;
      updateWriter();
    }),
);

function pickMission() {
  const pool = MISSIONS.filter((m) => m !== lastMission);
  return (lastMission = pool[Math.floor(Math.random() * pool.length)]);
}

$("create").onclick = () => {
  const text =
    mode === "solo" ? pickMission() : $("message").value.trim().toUpperCase().replace(/\s+/g, " ");
  if (!/[A-Z]/.test(text) || /[^A-Z0-9 .,!?'-]/.test(text)) {
    $("error").textContent = "Try a word or sentence using English letters.";
    return;
  }
  round = {
    text,
    cipher,
    shift: +$("shift").value,
    limit: +$("timer").value,
    hideSpaces: $("spaces").checked,
    player: (turn + 1) % 2,
    mode,
    done: false,
    won: false,
    revealed: [],
    hints: 0,
  };
  $("message").value = "";
  if (mode === "solo") start();
  else {
    $("handoffTitle").textContent = "Your turn, " + names[round.player] + "!";
    $("handoffRule").textContent = clueRule(round.limit);
    show("handoff");
  }
};

function renderCode() {
  let s = round.cipher === "pigpen" ? round.text : encode(round.text, round.cipher, round.shift);
  if (round.hideSpaces) s = s.replace(/ /g, "");
  $("code").replaceChildren();
  s.split(" ").forEach((word) => {
    const w = document.createElement("span");
    w.className = "word";
    [...word].forEach((ch) => {
      const el = document.createElement("span");
      if (round.cipher === "pigpen" && ABC.includes(ch)) el.innerHTML = pig(ch);
      else el.textContent = ch;
      w.append(el);
    });
    $("code").append(w);
  });
}

// Elapsed time plus clue penalties: adds to a stopwatch, eats into a countdown.
function seconds() {
  return Math.max(0, Math.floor((Date.now() - round.started) / 1000)) + round.penalty;
}

function clueRule(limit) {
  return limit
    ? "⏱ Clues cost time: the 1st clue takes 5 seconds off your clock, the 2nd takes 10, and every clue after that takes 15."
    : "◷ Clues cost time: the 1st clue adds 5 seconds to your time, the 2nd adds 10, and every clue after that adds 15.";
}

function updateHintButton() {
  const cost = hintCost(round.hints + 1);
  $("hint").textContent = `💡 Give me a clue (${round.limit ? "−" : "+"}${cost}s)`;
}

$("timer").onchange = () => ($("clueRule").textContent = clueRule(+$("timer").value));
$("clueRule").textContent = clueRule(+$("timer").value);

function clock() {
  const t = round.limit ? Math.max(0, round.limit - seconds()) : seconds();
  $("clock").textContent =
    (round.limit ? "⏱ " : "◷ ") +
    String(Math.floor(t / 60)).padStart(2, "0") +
    ":" +
    String(t % 60).padStart(2, "0");
  $("clock").classList.toggle("urgent", round.limit > 0 && t <= 15);
  if (round.limit && seconds() >= round.limit) finish(false, true);
}

function start() {
  clearInterval(tick);
  Object.assign(round, {
    started: Date.now(),
    done: false,
    won: false,
    revealed: [],
    hints: 0,
    penalty: 0,
  });
  updateHintButton();
  $("label").textContent = round.cipher.toUpperCase() + " MISSION";
  $("clue").textContent =
    (round.cipher === "caesar"
      ? "Move each letter back " + round.shift + (round.shift === 1 ? " place." : " places.")
      : round.cipher === "atbash"
        ? "Flip the alphabet: A ↔ Z, B ↔ Y…"
        : "Match each symbol to a letter in the code key.") +
    (round.hideSpaces ? " Watch out: word spaces are hidden!" : "");
  $("answer").value = "";
  $("feedback").textContent = "";
  $("hintText").textContent = "";
  $("hintText").classList.add("hidden");
  $("hint").disabled = false;
  setKeyVisible(false);
  $("key").innerHTML =
    '<h2>Your code key</h2><p class="helper">Letter on top. Its code underneath.' +
    (round.cipher === "pigpen"
      ? " Pigpen has different versions. Use this key for this game."
      : "") +
    '</p><div class="keygrid">' +
    [...ABC]
      .map(
        (ch) =>
          "<div><b>" +
          ch +
          "</b>" +
          (round.cipher === "pigpen" ? pig(ch) : encode(ch, round.cipher, round.shift)) +
          "</div>",
      )
      .join("") +
    "</div>";
  renderCode();
  show("play");
  clock();
  tick = setInterval(clock, 200);
  $("answer").focus();
}

$("start").onclick = start;

$("form").onsubmit = (e) => {
  e.preventDefault();
  if (round.done) return;
  if (round.limit && seconds() >= round.limit) return finish(false, true);
  const guess = $("answer").value;
  if (!normal(guess)) {
    $("feedback").textContent = "Type your answer, then give it a try.";
    return;
  }
  if (normal(guess) === normal(round.text)) return finish(true);
  const total = normal(round.text).length;
  const right = lettersRight(guess, round.text);
  $("feedback").textContent =
    `Good try! ${right} of ${total} letters are in the right spot. ` +
    "Check one letter at a time — the key and clues can help.";
};

function setKeyVisible(visible) {
  $("key").classList.toggle("hidden", !visible);
  $("keyButton").textContent = visible ? "🗝 Hide code key" : "🗝 Show code key";
  $("keyButton").setAttribute("aria-expanded", visible);
}

$("keyButton").onclick = () => setKeyVisible($("key").classList.contains("hidden"));

$("hint").onclick = () => {
  const chars = [...round.text];
  const left = chars
    .map((c, i) => (ABC.includes(c) && !round.revealed.includes(i) ? i : -1))
    .filter((i) => i >= 0);
  if (!left.length) return;
  // Reveal a random letter rather than always the first one, so clues feel less like a spoiler.
  round.revealed.push(left[Math.floor(Math.random() * left.length)]);
  round.hints++;
  const cost = hintCost(round.hints);
  round.penalty += cost;
  $("hintText").classList.remove("hidden");
  $("hintText").textContent = `A little help (${round.limit ? "−" : "+"}${cost} seconds): `;
  // Group letters into words so the clue keeps the same spacing as the secret message.
  const masked = chars
    .map((c, i) => (ABC.includes(c) && !round.revealed.includes(i) ? "_" : c))
    .join("");
  const words = document.createElement("span");
  words.className = "hintwords";
  (round.hideSpaces ? [masked.replace(/ /g, "")] : masked.split(" ")).forEach((w) => {
    const el = document.createElement("span");
    el.textContent = [...w].join(" ");
    words.append(el);
  });
  $("hintText").append(words);
  updateHintButton();
  if (left.length === 1) $("hint").disabled = true;
  clock();
};

function finish(won, timeout = false) {
  if (round.done) return;
  round.done = true;
  round.won = won;
  clearInterval(tick);
  $("resultIcon").textContent = won ? "🌟" : "🔎";
  $("resultTitle").textContent = won
    ? "You cracked it!"
    : timeout
      ? "Time for a breather."
      : "Keep exploring!";
  $("resultMessage").textContent = won
    ? "Great detective work. Every solved code is a new skill."
    : timeout
      ? "The clock stopped. You can try this code again without a timer."
      : "Have a look at the answer. Every try helps you learn.";
  $("solution").textContent = round.text;
  $("stats").textContent =
    seconds() +
    " seconds" +
    (round.penalty ? ` (including ${round.penalty}s for clues)` : "") +
    " · " +
    round.hints +
    " clue" +
    (round.hints === 1 ? "" : "s") +
    " used";
  $("scoreboard").replaceChildren();
  if (won) {
    cracked++;
    saveCracked();
  }
  if (round.mode === "friends") {
    if (won) scores[round.player]++;
    turn++;
    names.forEach((n, i) => {
      const el = document.createElement("div");
      el.className = "scoreline";
      el.textContent = n + " · " + scores[i] + " ⭐";
      $("scoreboard").append(el);
    });
    $("again").textContent = "Swap turns →";
  } else {
    $("again").textContent = won ? "Another mystery →" : "Try this code again →";
  }
  show("result");
}

$("finish").onclick = () => finish(false);

$("again").onclick = () => {
  if (round.mode === "friends") return openSetup();
  if (round.won) return show("choose");
  // Retry the same message, without a timer.
  round.limit = 0;
  start();
};

function goHome(e) {
  // The logo is a link; stay in the app instead of reloading (which would wipe scores).
  e?.preventDefault();
  if (round && !round.done && !confirm("Leave this mission and go home?")) return;
  stopRound();
  show("welcome");
}

$("home").onclick = goHome;
document.querySelector(".brand").onclick = goHome;
