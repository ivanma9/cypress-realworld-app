# Agent guide

Read this before changing the repo. `BASELINE.md` is the last verified setup and test run. `.cursor/skills/verify-rwa/SKILL.md` is how to prove a user-facing change on the running app.

## Setup

- Node.js `22.20.0` (`.nvmrc`, `.node-version`). `engines` allows `^22.0.0 || ^24.0.0`.
- Yarn Classic `1.22.22` (`packageManager`). This repo is not compatible with Yarn 2+.
- From the repo root:

```shell
yarn install --frozen-lockfile
yarn dev
```

`yarn dev` serves the frontend at `http://localhost:3000` and the API at `http://localhost:3001`. It copies `data/database-seed.json` onto `data/database.json`. Every seed user's password is `s3cret`.

One app instance at a time. A second `yarn dev` (or a second `verify-rwa` launch) cannot be isolated: the UI is fixed on port 3000, and the API and UI share `data/database.json`. Do not start another one while one is up, and do not kill a server you did not start.

End-to-end tests rewrite `data/database.json`. Restore it with `git checkout -- data/database.json` before you commit. Do not commit that file's test churn.

## Checks

Run these from the repo root. API and end-to-end need `yarn dev` already up; `precypress:run` waits up to 60s for ports 3000 and 3001. Component tests start their own Vite server on port 3002 and do not need `yarn dev`.

| Check                       | Command                                        |
| --------------------------- | ---------------------------------------------- |
| Types                       | `yarn types`                                   |
| Lint                        | `yarn lint`                                    |
| Unit                        | `yarn test:unit:ci`                            |
| API                         | `yarn test:api`                                |
| Component                   | `yarn test:component:ci`                       |
| E2E (UI, Electron headless) | `yarn cypress:run --spec 'cypress/tests/ui/*'` |

The default Cypress browser is Electron headless. `yarn test:headless` runs every file under `cypress/tests/**/*.spec.*` (API, UI, demo, and auth providers). CI uses the UI spec above for e2e so API is not run twice.

CI for these commands is `.github/workflows/verify.yml` (pull requests into `develop`, and pushes to `develop`). Jobs: `checks` (install, types, lint, unit), `api-e2e`, and `component`. `api-e2e` runs `yarn build:ci`, `yarn db:seed:dev`, and `yarn start:ci`, then `yarn test:api` and the UI e2e command. It uses `yarn start:ci` instead of `yarn dev` because Vite's dev server was not reachable on port 3000 inside the `cypress/browsers` image (`wait-on` timed out there while the API answered). `yarn start:ci` is the Express server `.github/workflows/main.yml` already starts. Locally, keep using `yarn dev` for these same test commands. Verify does not record to Cypress Cloud and needs no secrets.

`.github/workflows/main.yml` (Cypress Tests) still runs on every push, including pull request branches. If `CYPRESS_RECORD_KEY` is set, it records to Cypress Cloud and splits each browser across 5 machines. If the key is absent, Chrome, Chrome mobile, Firefox, and Firefox mobile each run once, with recording and parallel off, so the specs actually execute. Do not set `record` or `parallel` without that secret. `--group` is sent only when recording, because Cypress rejects the flag otherwise.

## User-facing proof

Use the `verify-rwa` skill when a change is something a person can do in the app (sign-in, payments, the transaction feed, notifications, bank accounts, or any other screen). Passing unit or Cypress tests is not that proof.

```shell
.cursor/skills/verify-rwa/bin/verify-rwa launch
.cursor/skills/verify-rwa/bin/verify-rwa drive <feature>
.cursor/skills/verify-rwa/bin/verify-rwa cleanup
```

`<feature>` is one of `sign-in`, `send-payment`, `transaction-feed`, `notifications`, `bank-accounts`. Read `.cursor/skills/verify-rwa/features/<feature>.md` first. `drive` keeps evidence in `artifacts/verify-rwa/<feature>/<timestamp>/` (gitignored). In the PR, name the feature and what you observed: the action, the resulting screen, and the database side effect.

Do not launch `verify-rwa` while `yarn dev` or another drive is already running.

## Rules

- One scoped task per PR. Open it against `develop`. Fill in every section of `.github/pull_request_template.md`.
- Never weaken, skip, delete, or loosen a test to make it pass. Fix the code or report the failure.
- Do not run two app instances at once.
- Known failure, until it is fixed: `yarn test:component:ci` exits 1. Spec `src/components/TransactionDateRangeFilter.cy.tsx`, test `should render a defined date range filter`. The chip `[data-test='transaction-list-filter-date-range-button']` renders `Date: undefined` instead of the formatted range. That is an application bug (see `BASELINE.md`). Leave the test failing. Do not skip it. The CI `component` job stays red until the bug is fixed.

CI does not cover Firefox, mobile viewports, Percy, Cypress Cloud, third-party auth specs, or `verify-rwa`. `BASELINE.md` lists those gaps.
