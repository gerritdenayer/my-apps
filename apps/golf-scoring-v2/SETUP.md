# Golf Matchplay Live Scoring v2 - Setup

v2 supports multiple competitions at the same time. Every competition gets its
own storage bin, created automatically by the admin page. One central
"registry" bin holds the list of competitions and the shared course library
(tee boxes with Par, Slope and Course Rating).

## One-time setup

1. On jsonbin.io, create a new bin with exactly this content, and copy its ID:

   {"competitions":[],"courses":{}}

2. Create an Access Key (account menu > Access Keys) with these rights on
   Bins: **Create**, **Read**, **Update** (Delete is optional, it lets the
   app clean up storage when you delete a competition). Do NOT use the
   Master Key in the app.

3. Fill both values into config.js (REGISTRY_BIN_ID and JSONBIN_ACCESS_KEY),
   plus your own admin PIN.

## What's new in v2

- Multiple competitions at the same time; admin home screen lists them all
- Tie after the final hole: choose "halve the match" or "play-off" per competition
- Color themes per competition
- Courses (tee boxes, Par/Slope/CR) are stored centrally and shared
- Match QR codes now contain the competition, so players land in the right one
