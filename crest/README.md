# The CREST Model Family — Animated Presentation

An interactive, **auto-playing HTML presentation** about the **Coupled Routing and Excess STorage (CREST)** distributed hydrological model family (2011–2026), developed at the **Hydrometeorology and Remote Sensing Laboratory (HyDROS Lab), University of Oklahoma**.

This deck was **synthesized** from 15 CREST-related PowerPoint presentations (dedicated CREST decks, conference talks, and posters). Repetitive material was merged into a single coherent storyline, and the key diagrams were **recreated from scratch** as clean, animated SVG/CSS figures rather than screenshots of the originals.

## View it

Open **`index.html`** in any modern web browser — no build step, no server, no internet connection required. Everything (the reveal.js engine in `vendor/`, styles, and scripts) is bundled locally.

> Tip: if you later enable **GitHub Pages** for this repo, the deck becomes a shareable live URL automatically.

## Contents

| # | Slide | Highlight |
|---|-------|-----------|
| 1 | Title | Animated rainfall hero |
| 2 | What is CREST? | Forcings → engine → outputs diagram (2 / 17 / 9) |
| 3 | Inside the model | Recreated water-balance schematic: rainfall, ET, sub-grid soil-moisture capacity curve, three soil layers, cell-to-cell routing, outlet hydrograph |
| 4 | Global impact | Animated count-up statistics |
| 5 | Family tree | Milestone timeline 2006 → 2026 |
| 6 | Applications | EF5, iCRESLIDE, CREST-iMAP, CREST-VEC, v3.0, CREST-AI |
| 7 | Global reach | Rotating-globe deployment map + capacity-building |
| 8 | Future opportunities | Research directions |
| 9 | Thank you | Contact + selected references |

## Controls

- **Auto-play** advances on its own; press any arrow key to take manual control.
- `→ / ←` or `Space` — navigate · `Esc` — slide overview · `F` — fullscreen.

## Tech

- [reveal.js 4.6](https://revealjs.com) (vendored locally) for the slide engine.
- Hand-authored SVG + CSS keyframe animations for every figure.
- A small `app.js` for the rainfall generator, count-up animation, and routing-grid builder.

## Credits

CREST model family — University of Oklahoma × NASA SERVIR, and OU × NOAA/NSSL collaborations, with contributions from Jiahu Wang, S. Sorooshian, Yang Hong, Li Li, Jonathan J. Gourley, Sadiq I. Khan, Koray K. Yilmaz, Robert F. Adler, Xianwu Xue, Ke Zhang, Xinyi Shen, Zhi Li, Mengye Chen, Shang Gao, Humberto Vergara, Pierre Kirstetter, Yixin Wen, Songkun Yan, and many others.

See the **Selected key references** section on the final slide for the underlying publications.
