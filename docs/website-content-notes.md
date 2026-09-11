# Website content notes

## Compatibility examples

The public compatibility table summarizes development observations from the
PackGauge firmware repository's `docs/FINDINGS.md`, blob
`8b5f4d7a1e68e9f61cfd2d236c0786ba6d25168e`.

| Public sample | Evidence in the development notes | Scope |
| --- | --- | --- |
| 3Ah | Type 104: cell readings, discharge totals, and cross-checked current-history totals | Observed revision only |
| 5Ah | Newer type 498: communication succeeded; statistics blocks returned unavailable data | Partial history; no blanket compatibility claim |
| 6Ah | Nearly new sample: charge counts/time populated while several other blocks were unwritten | Blank history is not a reassuring zero |
| 12Ah | Three type-384 samples: identity/cells and high-level history; older fault, load, and condition blocks absent | Interface hardware and internal revision still matter |

These are bench observations, not a certification or a complete list of supported
models. Do not infer compatibility from capacity alone or count the website's
sanitized example screens as test evidence. The public table deliberately omits
third-party branding, serials, and identifying sample information.

## Development updates

The updates action opens a prefilled email to `contact@packgauge.com`. The visitor
must send it. It is a manual request, not an automated subscription form. The site
does not store email addresses or claim that a visitor has been subscribed.

## Presentation

The existing `screen-pack.svg` is the sharp, screen-on poster for both viewers.
It remains visible while loading and when 3D is unavailable. Three.js loads only
after a visitor requests a 3D view. Static views redraw on demand; rotating views
stop outside the viewport or when the page is hidden. Dragging and the directional
buttons pause rotation until the visitor resumes it.

The approved social card is `public/og-packgauge-v3.jpg`. Its metadata lives in
the three HTML pages; the deployment workflow does not rewrite that metadata.
