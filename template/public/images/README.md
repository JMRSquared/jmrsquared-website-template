# Images

Site imagery lives here and is served from `/images/...`.

- Optimise before committing. Raw 1–5 MB PNGs break the LCP < 2.5s bar.
- Reserve space (`width`/`height` or `aspect-ratio`) on every `<img>` to keep CLS < 0.1.
- Cutout PNGs sourced via the `pngimg-assets` skill are CC BY-NC 4.0 and need a `CREDITS.md` entry.
