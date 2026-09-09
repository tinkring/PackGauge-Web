# Website content and demo contract

## Purpose

Explain PackGauge as a standalone diagnostic reader, let visitors explore an illustrative scan, and make compatibility and development status easy to find. The site is not connected to a battery, account, email list, checkout, or firmware download service.

## Content boundaries

- All interactive demo and comparison values are invented public website examples. They are **not** field-test results, customer data, product photography, a promise of final hardware appearance, or an exact reproduction of the firmware interface.
- `src/sample-data.js` is the only source for interactive sample data and CSV generation. The default HTML has a matching readable snapshot, checked by the unit tests, for visitors without JavaScript.
- The eight-band load illustration is a simplified web chart, not the firmware's histogram bin definition. Cell bars use a zero-to-4.2-V scale; their colors are relative presentation cues, not pass/fail certification.
- The limited-history profile demonstrates missing fields. Missing values remain `null`, render as **Unavailable**, and export with an empty value plus an explicit `unavailable` status. A real zero remains zero.
- Equivalent cycles are calculated from cumulative discharge and nominal capacity; they are not remaining capacity. Spread is the highest minus the lowest of five bank readings.
- Existing compatibility type codes are preserved as a **reference**, not portrayed as comprehensive device testing. Observations about some tested Forge firmware must not become claims about all Forge revisions.
- Scanning, saved-scan browsing, comparison, and configured email reporting are the described device workflows. Do not add unverified claims about commercial availability, accuracy, scan timing, battery authentication, repair, or health certification.
- Preserve independent-project/trademark notices, physical battery precautions, diagnostic limitations, and the distinction between pack-side statistics refresh and a user command that rewrites stored values.
- No private firmware files, scan identifiers, credentials, personal contact information, or private repository links belong in the public site.

## Visitor actions

The hero leads to the interactive sample. The demo switches five views and two sample profiles, and creates a real local CSV download. No data is uploaded. The project-status section links to the **public website repository**, not to a nonexistent product release or private source. There is no signup form or fake buy button. Add a release or mailing-list action only when its real destination exists.

## Design and implementation

Three static Vite pages share `src/styles.css` and `src/main.js`. No framework, runtime dependency, third-party script, analytics, remote font request, or new service is needed. The original package manifest, lockfile, domain, sitemap, Pages deployment, and existing social-preview image are retained. Typography uses a system stack.

Readable content is visible by default; JavaScript enables navigation and demo controls. Native details/summary handles the FAQ. The tabs support Left/Right, Home/End, roving focus, and correctly hidden inactive panels. The mobile menu supports Escape, outside clicks, focus leaving the header, and viewport changes. Reduced-motion preferences disable smooth scrolling and transitions. Compatibility tables scroll within their own region.

## Validation

```sh
npm ci
npm run check
npm run build
npm run preview -- --host 127.0.0.1
```

In a second terminal (Python 3.10 or newer):

```sh
python -m pip install -r tests/requirements.txt
python -m playwright install chromium
python -m unittest discover -s tests -p browser_test.py -v
```

The read-only PR workflow runs source tests, the Vite production build, and Chromium checks. It does **not** deploy Pages. Existing pushes to `main` still use the original Pages workflow.

Browser checks cover the three pages at ten widths from 320 to 1920 pixels, tabs and keyboard behavior, both sample profiles, missing data, real CSV downloads, the mobile menu, reduced motion, FAQ operation, and no-JavaScript content. These are regression checks, not a certification of accessibility, hardware behavior, or cross-browser compatibility.

`PACKGAUGE_BASE_URL` overrides the preview URL. `BROWSER_EXECUTABLE` selects a local Chromium. `PACKGAUGE_SOURCE_PREVIEW=1` renders local HTML/CSS/JS in memory when network navigation is unavailable. That offline mode validates source behavior and layout but **does not validate Vite's production build**, so the default CI test deliberately uses the built preview server.

## Before publishing a future product release

Add approved product photos or real screenshots with permission and without personal scan identifiers; verify current hardware compatibility, distribution format, instructions, and availability; replace development-state wording with real destinations. Do not imply a finished enclosure or an ordering path before those exist.
