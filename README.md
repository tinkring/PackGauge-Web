# PackGauge Web

Static product website for [packgauge.com](https://packgauge.com), built with Vite and deployed through GitHub Pages.

This repository contains only the public website. It is intentionally standalone and does not require or contain the private PackGauge application source, build system, tests, or Git history.

## Product preview

The homepage introduces the standalone reader, provides a five-view interactive sample, explains the scan/save/compare workflow, and links to compatibility and safety details. The current public release state remains **in development; no public downloadable release yet**. There is no checkout, signup backend, live battery connection, or firmware download disguised as a website demo.

`src/sample-data.js` contains website-only illustrative profiles. These are not physical battery scans or a model compatibility matrix. The limited-history profile intentionally uses `null` for unavailable fields; do not substitute zero. The sample CSV is generated locally from the selected profile, explicitly labels its illustrative origin, and is not the device's canonical export format. The saved-scan comparison is also an illustration, not a real battery record or health assessment.

The demonstration is not an exact firmware screenshot or product photograph. Replace or supplement it with verified hardware imagery when suitable public assets are available. Do not copy private firmware source, configuration, credentials, or private repository links into this public site.

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

The output is written to `dist/`. The checks cover sample arithmetic, missing-data handling, CSV provenance, accessible control relationships, real anchor destinations, safety/compatibility language, and deployment configuration. They are not a substitute for browser QA.

For browser QA, exercise all five views and both sample profiles; export each CSV; test arrow keys, Home, End, Escape, mobile navigation, and FAQ disclosure controls. Check 320, 390, 768, 900, 1024, and 1440px widths, disabled JavaScript, and reduced motion. Without JavaScript the homepage exposes all five sample panels and retains navigation; profile switching and CSV export require JavaScript.

Pull requests run `.github/workflows/checks.yml`, which tests and builds without deploying. Production publishing remains restricted to the existing `main` workflow below. Review a redesign branch before merging it into the live site.

## GitHub Pages and custom domain

The repository workflow at `.github/workflows/pages.yml` tests and builds the repository root on pushes to `main`, then publishes `dist`. The `public/CNAME` file is copied into that artifact.

After the workflow has deployed successfully:

1. In GitHub, open **Settings → Pages** and confirm the source is **GitHub Actions**.
2. Set the custom domain to `packgauge.com` if GitHub has not inferred it from `CNAME`.
3. At the DNS provider, create these apex `A` records:
   - `185.199.108.153`
   - `185.199.109.153`
   - `185.199.110.153`
   - `185.199.111.153`
4. Optionally create `www` as a `CNAME` to `tinkring.github.io` and add `www.packgauge.com` as a redirect at the DNS/registrar layer if desired.
5. Wait for GitHub’s DNS check to succeed, then enable **Enforce HTTPS**.

Do not create a `CNAME` record at the zone apex unless the DNS provider explicitly supports ALIAS/ANAME flattening. GitHub documents the current values at <https://docs.github.com/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site>.
