# PackGauge Web

Static product website for [packgauge.com](https://packgauge.com), built with Vite and deployed through GitHub Pages.

This repository contains only the public website. It is intentionally standalone and does not require or contain the private PackGauge firmware source, build system, tests, or Git history.

## Product presentation

The homepage uses a red / black / white industrial visual system, a rendered standalone reader, and sanitized interface renders based on the current PackGauge UI. Raw prototype photographs, third-party battery logos, battery model marks, and identifying pack information are intentionally not used in the public artwork.

The interface images under `public/renders/` are website presentation assets. They are not live scans, health certifications, or screenshots of an identified physical battery. The Pack screen uses demo-only identifiers and representative values.

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
