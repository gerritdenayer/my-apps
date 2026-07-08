# Golf Knockout

A matchplay knockout bracket tool. One admin page builds and scores the bracket;
players and the clubhouse see it live through the viewer and kiosk pages.

## Pages

- `admin.html` — enter players, build the bracket, record scores, publish updates.
  Requires your JSONBin.io master key (entered in the browser, not stored in this repo).
- `viewer-men.html` / `viewer-ladies.html` — read-only live bracket for players to check on their phone.
- `kiosk-men.html` / `kiosk-ladies.html` — full-screen auto-refreshing display for a screen at the club.
- `docs/Gebruikershandleiding-Golf-Knockout.pdf` — Dutch user manual.

## How data works

All pages read/write a bracket stored on [JSONBin.io](https://jsonbin.io). Nothing is stored in this
repo itself — `admin.html` publishes to a bin, and the viewer/kiosk pages read from it using a
public bin ID that's already set inside each file. No player data or API keys are committed here.

## Setup notes

If you ever need to point a viewer or kiosk page at a different bin, open the file and edit the
`BIN_ID` constant near the top.
