# PackGauge Web

Static product website for [packgauge.com](https://packgauge.com), built with Vite and deployed through GitHub Pages.

This repository contains only the public website. It is intentionally standalone and does not require or contain the private PackGauge firmware source, build system, tests, or Git history.

## Product presentation

The homepage uses a red / black / white industrial visual system, a sharp screen-on reader preview, optional 3D hardware views, and sanitized interface renders based on the current PackGauge UI. Raw prototype photographs, third-party battery logos, battery model marks, and identifying pack information are intentionally not used in the public artwork.

The interface images under `public/renders/` are website presentation assets. They are not live scans, health certifications, or screenshots of an identified physical battery. The Pack screen uses demo-only identifiers and representative values.

The hero opens its rotating 3D view automatically after the page loads and the
preview is visible. Reduced-motion and data-saver preferences keep the still
preview until the visitor chooses 3D. The pinned Three.js version is served as a
separate site asset, without a runtime CDN dependency. The still image stays
visible if 3D cannot load. Rendering pauses outside the viewport and when the
browser tab is hidden; the lower hardware view opens on request and redraws only
when needed. Visitors can pause rotation or turn the model themselves.

The enlarged screen gallery has Previous/Next controls and supports the left and
right arrow keys. Closing it returns focus to the matching screen's enlarge button.

Contact actions open a standard email to `contact@packgauge.com`, using the
PackGauge brand without a personal salutation or signup language. Compatibility
examples come from documented bench observations, with limits stated for each sample.
See [website content notes](docs/website-content-notes.md) for the evidence and scope.

## Local development

```sh
npm ci
npm run dev
```

## Checks and production build

```sh
npm run check
npm run build
npm run preview
```

The output is written to `dist/`. Pull requests run `.github/workflows/checks.yml`, which tests and builds without deploying. Production publishing remains restricted to pushes to `main` through `.github/workflows/pages.yml`.

## GitHub Pages and custom domain

The `public/CNAME` file configures `packgauge.com`. Merging to `main` triggers the existing GitHub Pages deployment workflow.
