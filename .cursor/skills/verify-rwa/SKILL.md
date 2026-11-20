---
name: verify-rwa
description: >-
  Drive the Cypress Real World App in the browser and capture proof. Launches
  the Vite frontend on port 3000 and the Express/lowdb API on port 3001, signs
  in as a seed user through the real form, and exercises payments, the
  transaction feed, notifications, or bank accounts with Cypress. Use when a
  change needs evidence from the running app, not only from unit tests.
---

# Verify the Cypress Real World App

The user-facing surface is the React app at `http://localhost:3000` (local Passport sign-in, not Auth0/Okta/Cognito/Google). The Express API and lowdb JSON database are at `http://localhost:3001`. Read `features/README.md`, then the feature file for the journey under test.

Parallel runs cannot be isolated. `vite.config.ts` fixes the frontend at port 3000, `.env` sets `VITE_BACKEND_PORT=3001`, and `backend/database.ts` always reads and writes `data/database.json`. A second `yarn dev` either fails to bind or, for the API, `detect-port` silently moves to another port while the UI still calls 3001. Do not start a second verification run while one is up, and do not kill a server this run did not start.

Helper (executable): `.cursor/skills/verify-rwa/bin/verify-rwa`

## Launch

From the repo root, with Node 22 or 24 and Yarn Classic 1.22 (`package.json` `engines` and `packageManager`):

```shell
yarn install --frozen-lockfile
.cursor/skills/verify-rwa/bin/verify-rwa launch
```

`launch` runs the install itself when `node_modules/cypress` is missing. It refuses when port 3000 or 3001 is already taken, or when a previous launch pid is still alive. It then runs `yarn dev`. `predev` copies `data/database-seed.json` onto `data/database.json` before the servers listen. The script records the `setsid` pid in `artifacts/verify-rwa/run/pid` and the log in `artifacts/verify-rwa/run/dev.log`.

Ready means all of the following, not merely a live process:

- `GET http://localhost:3000/` is the Vite dev document: title `Cypress Real World App` and script `/src/index.tsx` (a production `build/` serve does not include that script).
- `GET http://localhost:3001/` returns `Cypress Realworld App - backend`.
- `POST http://localhost:3001/graphql` with `{"query":"{ __typename }"}` returns HTTP 200.
- `data/database.json` has the five seed users and `Heath93`'s password hash matches `s3cret`.

`launch` waits up to 60 seconds and then runs doctor. It returns only when doctor passes.

Every seed user's password is `s3cret` (`SEED_DEFAULT_USER_PASSWORD`). These ids are from the committed `data/database-seed.json`. Do not run `yarn db:seed` during verification; that regenerates the seed and changes ids. Reset with `POST /testData/seed` or `yarn db:seed:dev`.

| Username | Name | id | Balance (cents) | Bank |
| --- | --- | --- | --- | --- |
| Heath93 | Ted Parisian | uBmeaz5pX | 150953 | Waters, King and O'Reilly Bank |
| Arvilla_Hegmann | Kristian Bradtke | GjWovtg2hr | 93026 | D'Amore Inc Bank |
| Dina20 | Darrel Ortiz | _XblMqbuoP | 158880 | Okuneva Inc Bank |
| Reyes.Osinski | Ruthie Prosacco | M1ty1gR8B3 | 117683 | Rosenbaum, Dach and Goyette Bank |
| Judah_Dietrich50 | Lia Rosenbaum | WHjJ4qR2R2 | 49474 | Schaden - Halvorson Bank |

Heath93's contacts are Arvilla_Hegmann, Dina20, and Reyes.Osinski. Each user has 8 unread notifications and one bank account. Balances are cents. The Pay form takes dollars (`35` is stored as `3500`).

Teardown is `cleanup` below. Launch does not delete evidence from an earlier drive.

## Doctor

Run this first whenever something looks off. It is read-only: it does not log in, does not reseed, and does not click the UI.

```shell
.cursor/skills/verify-rwa/bin/verify-rwa doctor
```

It passes only when:

- `artifacts/verify-rwa/run/pid` exists and that pid is alive.
- The listeners on 3000 and 3001 are that pid or one of its descendants. Another process on those ports fails the check.
- The frontend HTML is the Vite dev app named above, so this is not a production bundle or a different site.
- The API root string and GraphQL `__typename` check succeed.
- The on-disk seed still authenticates: `bcryptjs` compares `Heath93`'s hash to `s3cret`, and the other four usernames are present. A successful doctor does not create a session.

A passing doctor prints `doctor-ok pid=<pid> frontend=http://localhost:3000 api=http://localhost:3001 build=vite-dev`.

## Drive

Drive with the repo's Cypress install, through the real UI. The specs live outside `cypress/tests/**/*.spec.*`, so `yarn cypress:run` and CI do not pick them up. Cypress config for a drive is `.cursor/skills/verify-rwa/cypress.config.ts`. It reuses `cypress/support/e2e.ts` and the `db:seed` task from the root config. `db:seed` posts to `http://localhost:3001/testData/seed`, which is the same reset the repo's end-to-end tests use. That reset is the documented way back to the committed seed. It is not a substitute for the user path.

```shell
.cursor/skills/verify-rwa/bin/verify-rwa drive send-payment
.cursor/skills/verify-rwa/bin/verify-rwa drive sign-in
.cursor/skills/verify-rwa/bin/verify-rwa drive transaction-feed
.cursor/skills/verify-rwa/bin/verify-rwa drive notifications
.cursor/skills/verify-rwa/bin/verify-rwa drive bank-accounts
```

The optional second argument is `electron` (default, Cypress's bundled browser) or `chrome`. The verification config sets `viewportWidth` 1280 and `viewportHeight` 1000, the same values as the repo e2e config. Cypress 16 headless Electron still saves screenshots at 1280×720. That width is the desktop layout: the sidenav stays open, so the username and balance are on screen. Below the `sm` breakpoint they sit behind `[data-test=sidenav-toggle]`. Do not treat a mobile-width run as the same proof.

`drive` requires a passing doctor, posts `/testData/seed`, then runs one attempt (`retries.runMode` is 0 in the verification config, so a pass is not a later retry). Cypress 16 reads the evidence directory with `Cypress.expose("VERIFY_RWA_EVIDENCE")`. The verification config copies that from the `VERIFY_RWA_EVIDENCE` environment variable. `Cypress.env()` was removed in Cypress 16 and will throw. The command is:

```shell
VERIFY_RWA_EVIDENCE=artifacts/verify-rwa/<feature>/<utc-stamp> \
  yarn cypress run --browser electron \
  --config-file .cursor/skills/verify-rwa/cypress.config.ts \
  --spec .cursor/skills/verify-rwa/specs/<feature>.cy.ts
```

Stable handles are `data-test` attributes. The support command `cy.getBySel("signin-username")` is `[data-test=signin-username]`. Prefer those over coordinates or CSS structure. Sign in by typing the seed username and `s3cret` into `[data-test=signin-username]` and `[data-test=signin-password]` and clicking `[data-test=signin-submit]`. `cy.login` in `cypress/support/commands.ts` types those same fields; it is acceptable. These are not proof, because they skip the screen the user touches:

- `cy.loginByApi`, `cy.loginByXstate`, `cy.logoutByXstate`, `cy.switchUserByXstate`
- `cy.createTransaction` (sends an XState event)
- `cy.setTransactionAmountRange` (calls the slider's React `onChange`)
- `cy.nextTransactionFeedPage` (sends an XState `FETCH`)
- `cy.pickDateRange` (uses `cy.clock` before clicking the calendar)

Open a mapped feature file for the exact steps. If a precondition is missing, stop and report the command you ran and the unmet precondition. Do not swap in a different path and call it verified.

## Evidence

`drive` writes `artifacts/verify-rwa/<feature>/<UTC timestamp>/`. That directory is gitignored. Cleanup does not remove it.

Each recipe captures:

- A Cypress screenshot of the action and of the resulting screen. The document title is `Cypress Real World App`; after sign-in the header logo (`[data-test=app-name-logo]`) is in the shot.
- An ARIA-style text dump next to the screenshot (`<step>.aria.txt`): tag or role, `data-test`, and visible text for headings, buttons, links, inputs, and `data-test` nodes.
- `side-effect.json` (and a second file when the spec has a second mutation) read from `data/database.json` after the UI shows the result. Payments must show the new transaction row, both balances, and the receiver notification. Dismissed notifications must show `isRead: true`. A new bank account must show `isDeleted` after delete.
- `commands.txt`, `git-sha.txt`, `cypress-exit-code.txt`, and the Cypress video under `videos/` (`videoCompression` is off).

A green screenshot of the last screen is not enough. The action shot, the result shot, and the database JSON have to agree. Do not mock the API. The only test-only route in the recipe is `POST /testData/seed`, used to reach the committed seed before the user path starts.

## Cleanup

```shell
.cursor/skills/verify-rwa/bin/verify-rwa cleanup
```

Cleanup signals the recorded pid, its process group, and its descendants, then SIGKILL only if they are still alive. It checks `/proc/<pid>/cmdline` and will not signal a recycled pid that is not `yarn`, `node`, or `concurrently`. It never kills by process name. If `drive` ran, it copies `data/database-seed.json` back over `data/database.json` after the server is stopped, so lowdb cannot rewrite the seed mid-copy. It does not delete `artifacts/verify-rwa/<feature>/`.

## Helpers

| Command | What it does |
| --- | --- |
| `.cursor/skills/verify-rwa/bin/verify-rwa launch` | Install if needed, refuse a shared instance, start `yarn dev`, wait until doctor passes |
| `.cursor/skills/verify-rwa/bin/verify-rwa doctor` | Read-only ownership, dev-build, API, and seed-password check |
| `.cursor/skills/verify-rwa/bin/verify-rwa drive <feature> [electron\|chrome]` | Seed, run that feature's Cypress spec, keep evidence |
| `.cursor/skills/verify-rwa/bin/verify-rwa cleanup` | Stop this run's processes and restore `data/database.json` |

The Cypress recipes are `.cursor/skills/verify-rwa/specs/<feature>.cy.ts`. Keep them aligned with `features/`. `/maintain-verification-skill` is how this map stays current when routes, `data-test` selectors, seed users, or ports change.
