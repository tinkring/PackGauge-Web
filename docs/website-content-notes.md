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

## Contact

The contact action opens a standard email to `contact@packgauge.com`. Public
contact copy uses the PackGauge brand and does not include the owner's name,
a prewritten message, or an invitation to subscribe. The site does not store
email addresses or claim that a visitor has been subscribed.

## Presentation

The existing `screen-pack.svg` is the sharp, screen-on poster for both viewers.
It remains visible while loading and when 3D is unavailable. The hero starts 3D
automatically once the page is loaded and the preview is visible, unless reduced
motion or data saving is requested. The lower hardware view opens on request.
Three.js is pinned at 0.180.0 and served from the site's own build output. Static
views redraw on demand; rotating views stop outside the viewport or when the page
is hidden. Dragging and the directional buttons pause rotation until the visitor
resumes it. A manual request cancels any pending automatic start.

The enlarged gallery uses the same five sanitized SVG renders, with Previous/Next
buttons and left/right arrow keys. It keeps the selected tab in sync and returns
keyboard focus to the corresponding enlarge button when closed.

The approved social card is `public/og-packgauge-v3.jpg`. Its metadata lives in
the three HTML pages; the deployment workflow does not rewrite that metadata.
