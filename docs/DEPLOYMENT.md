# Deploying to Cloudflare Workers

The site is a static Astro build served by the **existing** Worker
**`wizardfingers`** (no hyphen) using Workers Static Assets.

> ⚠️ Never deploy to the old Worker **`wizard-fingers`** (with a hyphen) in the
> other account, and never create a second production Worker. The Worker name
> is fixed in `wrangler.jsonc`.

## What the configuration does

`wrangler.jsonc`:

| Setting | Why |
| --- | --- |
| `name: "wizardfingers"` | Targets the existing Worker. |
| `main: "worker/index.ts"` | Small Worker that redirects `www` → apex and adds security/cache headers, then serves files from the assets binding. |
| `assets.directory: "./dist"` | Astro's static output. |
| `assets.not_found_handling: "404-page"` | Unknown URLs get `dist/404.html` with a real **404** status. |
| `assets.html_handling: "auto-trailing-slash"` | `/work/slug` → `/work/slug/`, matching canonical URLs. |
| `assets.run_worker_first: true` | The Worker must see every request so it can redirect `www`. |
| `workers_dev: false`, `preview_urls: false` | Keeps the workers.dev URL and Preview URLs **disabled**, as observed in the dashboard. Wrangler defaults `workers_dev` to `true` when it is omitted, so these are explicit on purpose. |
| `previews: {}` | Enables `npx wrangler preview` for non-production branch builds. Inherits the top-level config; does not affect production deploys. |
| `routes` (both `custom_domain: true`) | The two custom domains already attached to this Worker, declared so deploys keep them attached. |

Redirect: `https://www.wizardfingers.com/<path>?<query>` → **301** →
`https://wizardfingers.com/<path>?<query>`. This is done in the Worker, not with a
Pages-style `_redirects` file (host-based redirects aren't possible there).

DNS is not modified by this project. MX, TXT and email records, the nameservers
(`etta.ns.cloudflare.com`, `viddy.ns.cloudflare.com`) and the Lovable-managed
registration are untouched; do not repeat the domain migration or DNS cleanup.

## Before any remote operation: verify the account

```sh
npx wrangler login            # or set CLOUDFLARE_API_TOKEN in your shell (never commit it)
npx wrangler whoami           # lists the accounts the credentials can access
```

1. Confirm the account that owns the `wizardfingers.com` zone and the
   `wizardfingers` Worker (Dashboard → Workers & Pages → `wizardfingers` →
   Settings → Domains & Routes shows both custom domains).
2. If the credentials can reach more than one account, pin the right one for the
   session — do not commit it:

   ```sh
   export CLOUDFLARE_ACCOUNT_ID=<intended account id>
   ```

3. Sanity-check the target exists in that account:

   ```sh
   npx wrangler deployments list --name wizardfingers
   ```

   If this reports the Worker doesn't exist, **stop** — you are in the wrong account.

## Validate locally

```sh
npm ci
npm run verify                     # astro check + Worker types + build + tests
npx wrangler deploy --dry-run      # bundles the Worker and assets without uploading
npm run preview                    # serves dist/ through the real Workers runtime on :8787
```

Test the www redirect locally:

```sh
npx wrangler dev --local-upstream www.wizardfingers.com --port 8788
curl -sI "http://127.0.0.1:8788/work/x/?a=1"   # → 301 Location: https://wizardfingers.com/work/x/?a=1
```

## Deploy (only when explicitly approved)

### Option A — from your machine

```sh
npm run deploy        # = npm run verify && wrangler deploy
```

If Wrangler reports that a custom domain is attached to a **different** Worker,
or asks to override an existing domain, answer **no** and re-check the account.

### Option B — Workers Builds (Git integration)

If the Worker is connected to this GitHub repository
(Dashboard → `wizardfingers` → Settings → Build):

| Field | Value |
| --- | --- |
| Root directory | `/` |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Non-production branch deploy command | `npx wrangler preview` (needs the `previews` block in `wrangler.jsonc`) |
| Production branch | `main` (current setting) — merging to `main` deploys to production |

Node version comes from `.node-version` (22.22.0). No secrets or environment
variables are required.

Pushes to the production branch deploy automatically. Pushes to other branches
run `npx wrangler preview`, which creates a Worker Preview (named after the
branch) and never receives production traffic. Wrangler refuses to run
`wrangler preview` unless `wrangler.jsonc` has a top-level `previews` block; an
empty `"previews": {}` is enough, because Previews inherit the top-level assets,
compatibility settings and Worker entry.

## About the previous failed build

The earlier Cloudflare build logs were **not available** from this environment:
the Cloudflare connector was not authorised and the dashboard could not be
reached, so no diagnosis is claimed here. The only verifiable fact is that this
repository had no commits on any branch when this implementation started.
To check the old failure: Dashboard → `wizardfingers` → Deployments / Builds →
the failed build → **View logs**. The new build was validated locally with
`npm run verify`, `wrangler deploy --dry-run` and `wrangler dev`.

## After deploying

```sh
curl -sI https://wizardfingers.com/                       # 200, CSP header present
curl -sI https://www.wizardfingers.com/work/?a=1          # 301 → https://wizardfingers.com/work/?a=1
curl -sI https://wizardfingers.com/does-not-exist/        # 404
curl -s  https://wizardfingers.com/sitemap.xml
```

Then confirm in the dashboard that workers.dev and Preview URLs are still
disabled and both custom domains are still listed.

## Rollback

Dashboard → `wizardfingers` → Deployments → pick the previous version →
**Rollback**, or `npx wrangler rollback`.
