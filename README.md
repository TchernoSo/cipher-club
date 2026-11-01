# Cipher Club 🕵️

A child-friendly codebreaking game. Crack secret messages written in **Caesar**, **Atbash** and **Pigpen** ciphers, on your own or taking turns with a friend.

**Play it:** https://tchernoso.github.io/cipher-club/

## How to play

- **Play on my own** – pick a cipher and crack a mystery message.
- **Play with a friend** – one player writes a secret message, passes the device, and the other cracks it. Players swap turns and collect stars.
- Choose a relaxed stopwatch or beat-the-clock timer (2 or 5 minutes).
- Stuck? Open the code key, or ask for a clue to reveal one letter.
- Wrong answers tell you how many letters are already in the right spot.
- Extra challenge: hide the spaces between words.

## Run locally

Open `index.html` in a modern browser. No install, build step, API key or database needed.

To run the cipher tests (needs Node 18+):

```sh
npm test
```

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Game screens |
| `style.css` | Visual design |
| `app.js` | Gameplay, timers and scoring |
| `ciphers.js` | Caesar, Atbash and Pigpen helpers (shared with the tests) |
| `tests/` | Node tests for the cipher helpers |
| `.github/workflows/pages.yml` | Runs the tests and deploys to GitHub Pages on every push to `main` |

## Notes

Friends mode uses one shared device. Scores reset on refresh; the total number of codes you've cracked is remembered in your browser. Messages are hidden in the interface, not securely encrypted – this is an educational game.

## License

MIT
