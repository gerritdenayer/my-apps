# DD Quiz

New web app in the `my-apps` repo, next to Marketing Hub.

Live link (after the first push): https://gerritdenayer.github.io/my-apps/apps/dd-quiz/

A phone quiz for the 30 minute Digital & Data lunch session ("Who we are, in 30 seconds").

## Conventions (same as Marketing Hub)

- Plain HTML, CSS and JavaScript. No build step. `index.html` is the entry point.
- The version shown in the app lives in one place: `js/config.js` (`appVersion`).
  Use minor versions (for example 0.1.0, 0.1.1) and bump only when pushing.
- Every change gets a short entry in `CHANGELOG.md` (an "Unreleased" section until it is pushed).
- Plain, clear English in the app and in the docs. American spelling. No m-dashes.
- Data never goes into the repo: the `.gitignore` at the repo root excludes `*.json`.
- Session materials (`materials/`, `.pptx`, `.pdf`) are excluded by the `.gitignore` in this folder. They are internal and stay on this computer.

## How it works in the session

- Everyone scans the QR code on the deck and enters their first name.
- Each round is locked. The code is on the round slide: **DATA**, **LAYERS**, **PROOF**.
- 7 questions per round, 30 seconds each (the "order the layers" question has 60).
- Correct answer = 500 points plus up to 500 bonus points for speed. Max 21,000.
- After round 3, each phone shows the final score. Find the winner by asking people to stand up above a score.
- Self-study mode (link on the home screen) plays all rounds without codes. Good for newcomers.

## Edit questions

All questions sit at the top of the script in `index.html`, in the `ROUNDS` list.
For multiple choice, the **first** option is always the correct one (the page shuffles them).
To change a round code, change `code:"DATA"` etc. and update the slide.
The codes are visible in the page source. That is fine for a fun lunch quiz, not for an exam.

## Publish

From the repo root:

```
cd ~/Documents/GitHub/my-apps
git add -A
git commit -m "DD Quiz: <what changed>"
git push
```
