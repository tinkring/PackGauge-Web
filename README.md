# PackGauge Web

Static product website for [packgauge.com](https://packgauge.com), built with Vite and deployed through GitHub Pages.

This repository contains only the public website. It is intentionally standalone and does not require or contain the private PackGauge application source, build system, tests, or Git history.

## Local development

```sh
npm ci
npm run dev
```

## Checks and production build

```sh
npm run check
npm run build
```

The output is written to `dist/`. The website currently offers an illustrative CSV sample, not a firmware download. There is no public product release or ordering flow. Add release links only after a public release destination exists.

## Website structure and browser checks

The homepage contains one interactive sample scan, two data-availability profiles, a clearly illustrative saved-scan comparison, a workflow, FAQ, and project-status section. Compatibility and safety remain separate pages with the same visual system.

See [docs/WEBSITE.md](docs/WEBSITE.md) for the public-content contract and browser-test instructions. `npm run check` covers data calculations, initial HTML, local links, truthful missing-data handling, CSV contents, safety language, and deployment configuration. The separate PR workflow tests the production build in Chromium without deploying it. No framework, runtime dependencies, tracking, or external signup service was added.

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
