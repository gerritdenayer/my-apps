# Changelog

## Unreleased

## 0.2.0

- New **Branches** panel: tick the teams you want to see. The chart shows only those teams, with their managers above them (dimmed) for context. A bar at the top shows what you picked, with "Change" and "Show whole chart".
- Search only looks inside the picked branches.
- New **Export** menu: download what you see as a PDF or PowerPoint file, with a dark or white background. Boxes and lines stay sharp, and the PowerPoint shapes can be edited.
- The export libraries (jsPDF, PptxGenJS) live in `js/vendor` and load only when you export.

## 0.1.0

- First version of the interactive org chart.
- Pan, zoom, fit, open and close teams, search with jump to match.
- Edit panel: name, role, note, orange reporting line, orange highlight.
- Add, move (drag and drop or "Report to"), reorder and remove boxes, with undo and redo.
- Open and save the chart as `org.json`. Chart kept in the browser between visits. No names in the repo.
- App version shown in the corner, read from `js/config.js`.
