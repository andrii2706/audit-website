# Troubleshooting

## `npm install` in `cms/` fails on `better-sqlite3` (Windows: "Could not find any Visual Studio installation")

```
prebuild-install warn install No prebuilt binaries found (target=23.11.1 …)
gyp ERR! find VS You need to install the latest version of Visual Studio
```

**Cause:** you're on a non-LTS Node version (23, 25…). `better-sqlite3` publishes prebuilt binaries only for LTS lines, so npm falls back to compiling C++. On Windows that needs Visual Studio Build Tools.

**Fix:** switch to Node 22.22.0 and reinstall. You don't need Visual Studio.

```powershell
nvm install 22.22.0
nvm use 22.22.0            # nvm-windows: run PowerShell as administrator
node -v               # v22.22.0
cd cms
Remove-Item -Recurse -Force node_modules, package-lock.json -ErrorAction SilentlyContinue
npm install
```

macOS/Linux: `rm -rf node_modules package-lock.json && npm install`.

## `EBADENGINE … undici@8.12.1 … Required: {"node":">=22.19.0"}`

Your Node 22 is too old (e.g. 22.14). Strapi 5.59 needs **22.19 or newer**: `nvm install 22.22.0 && nvm use 22.22.0`, then `npm install` again. `cms/scripts/check-node.mjs` / `web/scripts/check-node.mjs` (run before `dev`/`build`) prints the same advice.

## Web: `Cannot find module '@tailwindcss/postcss'` / two layouts in the import trace

- `npm install` wasn't run in `web/` after updating. Run it.
- If the trace mentions `src/app/layout.tsx`, the new version was unzipped **over** an old copy, and old files that conflict with `src/app/[locale]/` are still there. Unpack into an empty folder, or delete `src/app/layout.tsx`, `page.tsx`, `not-found.tsx`, `favicon.ico`, `posluhy/`, `korysne/` and `.next/`.

`scripts/check-node.mjs` (runs before `dev`/`build`) detects both cases and prints what to do.

## Strapi: `App keys are required` / `Missing … secret`

`cms/.env` is missing or its secrets are empty. Start the CMS with `npm run dev`: the `predev` step (`scripts/ensure-env.mjs`) creates the file and fills in missing secrets. Running `npx strapi develop` directly skips that step. You can also run `node scripts/setup.mjs` from the repo root.

## Strapi: `The upload folder … public/uploads doesn't exist`

Create it with `mkdir cms/public/uploads`. The `predev`/`prestart` npm scripts now create it automatically.

## Strapi: `unable to open database file`

`DATABASE_FILENAME` in `cms/.env` is empty or points to a missing folder. Set `DATABASE_FILENAME=.tmp/data.db`.

## Site shows empty sections / no services

- Is Strapi running and is `STRAPI_URL` correct in `web/.env.local`?
- Is the content **published** in the needed language?
- Did the first CMS start seed the DB? Seeding happens only if the DB was empty and `SEED_ON_EMPTY` isn't `false`. Check the Strapi log for `[seed]`.
- `npm run build` prerenders from Strapi. If the CMS was down during the build, pages fill in after the next revalidation, or rebuild.

## Lead form says "Something went wrong"

- `STRAPI_WEB_TOKEN` is missing or wrong. Take it from `cms/.tmp/web-token.txt`, or create a Custom token with only **Lead → create**.
- After resetting the CMS database a new token is generated. Update `web/.env.local` and restart the site.

## Edits in Strapi don't appear on the site

- `REVALIDATE_SECRET` must be identical in `cms/.env` and `web/.env.local`.
- `WEB_REVALIDATE_URL` must be reachable *from the CMS server* (e.g. `http://127.0.0.1:3000/api/revalidate`).
- The data cache also refreshes every hour by itself.

## Lead e-mails don't arrive

- Is `SMTP_HOST` set in `web/.env.local`? If it's empty, e-mail is disabled (leads still go to Strapi).
- Check the site log for `[mail] …` errors (wrong password, port or TLS). Port 465 needs `SMTP_SECURE=true`; 587 needs `false`.
- Gmail / Google Workspace needs an **App Password**, not the normal password.
- Is there a recipient? `LEAD_EMAIL_TO` or the e-mail in Strapi → Global.
- Mail in spam: configure SPF/DKIM for the domain in `MAIL_FROM`.

## `EADDRINUSE: address already in use :::3000`

Another process holds the port.

- Linux/macOS: `fuser -k 3000/tcp` or `lsof -i :3000`.
- Windows: `netstat -ano | findstr :3000`, then `taskkill /PID <pid> /F`.

## Styles or JS missing when running the standalone build

Run `npm start` (it uses `scripts/start-standalone.mjs`, which copies `.next/static` and `public` into the standalone folder). Don't run `node .next/standalone/server.js` directly.

## TypeScript errors about `.next/types` after moving routes

Delete `web/.next` and rebuild.


## `Argument of type '"api::…"' is not assignable to parameter of type 'ContentType'`

`cms/types/generated` was written by an older version of the project (for example after unzipping a new version over the old folder), so it doesn't know the new content types. TypeScript fails before Strapi gets to regenerate it. `npm run dev` now deletes an outdated `types/generated` automatically; on an older copy delete the folder by hand (`Remove-Item -Recurse -Force cms\types\generated` in PowerShell) and start again.
