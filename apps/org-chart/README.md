# Org Chart

Interactive, editable org chart, in the `my-apps` repo next to Marketing Hub and DD Quiz.

Live link (after the first push): https://gerritdenayer.github.io/my-apps/apps/org-chart/

## Where the names live (important)

- The app on GitHub contains **no names**. The people data lives in `org.json`.
- `org.json` is **not** pushed: the root `.gitignore` excludes `*.json`, and the `.gitignore` in this folder excludes it too.
- When you open the app, click **Open file** and choose your `org.json`. The app then keeps the chart in your browser.
- After changes, click **Save file**. Your browser downloads a new `org.json`. Replace the old one in this folder (or OneDrive) with it.
- To share with a colleague: send them the link and the `org.json` file. Each person keeps their own copy, so changes are not shared automatically.

## How to use it

- **Move around:** drag the background, scroll to pan, pinch or Ctrl/Cmd + scroll to zoom. **Fit** shows the whole chart.
- **Open or close a team:** click the small `+N` / `-` button under a box, or double-click the box.
- **Search:** type a name or team. Matches turn blue, closed teams open. Enter jumps to the next match.
- **Edit:** click a box. The panel on the right lets you change the name, role and note, and set the orange reporting line or the orange highlight.
- **Add:** "Add person below" or "Add person next to".
- **Move:** drag a box onto the box of its new manager, or pick "Report to" in the panel. "Move left / right" changes the order.
- **Remove:** "Remove with team" deletes the box and everyone below it. "Remove, keep team" moves the team up one level.
- **Undo / Redo:** buttons in the top bar, or Ctrl/Cmd + Z and Ctrl/Cmd + Y.
- **Rename the chart:** double-click the title in the top left.

## Conventions (same as Marketing Hub)

- Plain HTML, CSS and JavaScript. No build step. `index.html` is the entry point.
- The version shown in the app lives in one place: `js/config.js` (`appVersion`).
  Use minor versions (for example 0.1.0, 0.1.1) and bump only when pushing.
- Every change gets a short entry in `CHANGELOG.md` (an "Unreleased" section until it is pushed).
- Plain, clear English in the app and in the docs. American spelling. No m-dashes.
- Data never goes into the repo: `*.json` is excluded.

## Publish

From the repo root:

```
cd ~/Documents/GitHub/my-apps
git add -A
git status          # check that org.json is NOT in the list
git commit -m "Org Chart: <what changed>"
git push
```
