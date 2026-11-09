# Test baseline

Verified locally on 2026-11-09 against `develop` at `0729f68` (`chore: wait for the frontend and API before running Cypress`).

This is the out-of-the-box baseline for this fork. No application code or tests were changed to produce these results.

## Environment

| Item                    | Value                                                                                                                                                             |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OS                      | Ubuntu 24.04.5 LTS (linux)                                                                                                                                        |
| Node.js                 | v22.23.4 (`/exec-daemon/node`)                                                                                                                                    |
| Node pin                | `.nvmrc` and `.node-version` say `22.20.0`. `package.json` `engines` allows `^22.0.0 \|\| ^24.0.0`. v22.23.4 satisfies that range, so Node was left as installed. |
| Yarn                    | 1.22.22 (Classic). Matches the `packageManager` field.                                                                                                            |
| Cypress                 | 16.1.1                                                                                                                                                            |
| Default Cypress browser | Electron 146 (headless). Cypress 16 prints that Electron is deprecated as a test browser.                                                                         |
| Chrome                  | 156.0.8078.47 (`google-chrome` / `google-chrome-stable`)                                                                                                          |
| Firefox                 | Not installed                                                                                                                                                     |
| Timezone                | `Etc/UTC`                                                                                                                                                         |

## Setup that worked

README prerequisites are Node (see `.node-version`) and Yarn Classic. Both were already on the machine, so `npm install yarn@1 -g` was not run. Corepack 0.36.0 is present; the project `packageManager` field selects Yarn 1.22.22.

```shell
yarn install --frozen-lockfile
yarn cypress verify
yarn dev
```

`yarn install --frozen-lockfile` is the lockfile-enforcing form of the README `yarn` install. It finished in 41.28s. The `postinstall` script ran `husky install` and `patch-package` (`react-virtualized@9.22.5`). `yarn cypress verify` confirmed the binary at `/home/ubuntu/.cache/Cypress/16.1.1`. The install log did not show a fresh Cypress download, so that cache was already on the machine.

`yarn dev` is the README app command. `predev` copies the mock AWS export scripts and reseeds `data/database.json` from `data/database-seed.json`. After startup:

- Frontend (Vite 8.2.2): `http://localhost:3000/` returned HTTP 200
- API: `http://localhost:3001` returned HTTP 200
- `POST /graphql` returned HTTP 200

No extra apt packages, browser installs, or Node downgrade were required. Chrome and the bundled Electron browser both launched Cypress.

### Non-blocking warnings

These printed during install or test startup and did not fail a suite:

- `vite-plugin-istanbul@4.1.0` declares a peer dependency of Vite `>=2.9.1 <=5`. This repo uses Vite 8.2.2.
- Yarn: "Workspaces can only be enabled in private projects."
- `experimentalStudio: true` in `cypress.config.ts` was removed in Cypress 15.4.0. Cypress warns and continues. Studio tests still load.
- `caniuse-lite` / Browserslist data is about 11–13 months old.
- API boot: `express-validator` sanitizer middleware deprecation.
- Vite: `configLoader: 'native'` does not support the ESM syntax in `vite.config.ts`.

## Commands

API and end-to-end specs need the dev server. `yarn test:api` and `yarn cypress:run` run `precypress:run`, which waits up to 60s for `http://localhost:3000` and `http://localhost:3001`. Component tests start their own Vite server and do not need `yarn dev`.

`yarn cypress:run` with no `--spec` (also `yarn test:headless`) runs every file under `cypress/tests/**/*.spec.*` (API, UI, demo, and auth providers) on Electron. The runs below split that pattern so each suite has its own counts. The UI suite was also repeated on Chrome, which is the browser in `.github/workflows/main.yml`.

## Results

Times are the Yarn "Done in" / wall-clock time for the command, then the runner's own duration when it prints one. Counts are the runner summaries.

| Suite                            | Command                                                                                  | Result        | Passed | Failed | Skipped | Time                     |
| -------------------------------- | ---------------------------------------------------------------------------------------- | ------------- | ------ | ------ | ------- | ------------------------ |
| Typecheck                        | `yarn types`                                                                             | pass (exit 0) | —      | 0      | 0       | 5.14s                    |
| Lint                             | `yarn lint`                                                                              | pass (exit 0) | —      | 0      | 0       | 6.08s                    |
| Unit                             | `yarn test:unit:ci`                                                                      | pass          | 44     | 0      | 10      | 16.55s (Vitest 15.48s)   |
| API (Electron)                   | `yarn test:api`                                                                          | pass          | 51     | 0      | 0       | 36.54s (Cypress 8s)      |
| Component (Electron)             | `yarn test:component:ci`                                                                 | fail (exit 1) | 12     | 1      | 0       | 30s wall (Cypress 14s)   |
| UI e2e (Electron)                | `yarn cypress:run --spec 'cypress/tests/ui/*'`                                           | pass          | 58     | 0      | 0       | 131.66s (Cypress 1m 54s) |
| UI e2e (Chrome)                  | `yarn cypress:run --spec 'cypress/tests/ui/*' --browser chrome`                          | pass          | 58     | 0      | 0       | 118.89s (Cypress 1m 42s) |
| Demo + auth providers (Electron) | `yarn cypress:run --spec 'cypress/tests/demo/**/*,cypress/tests/ui-auth-providers/**/*'` | pass (exit 0) | 2      | 0      | 0       | 16.75s (Cypress 3s)      |

The demo and auth-provider files were one Cypress run. Its 2 passing tests are both in `demo/cypress-studio.spec.ts`. Each of the four auth-provider files reported 0 tests (see below).

Unit file summary: 8 files passed, 1 file skipped (9). Vitest 3.2.4.

API specs (9 files, all passing): `api-bankaccounts` 7, `api-banktransfers` 1, `api-comments` 2, `api-contacts` 4, `api-likes` 2, `api-notifications` 4, `api-testdata` 8, `api-transactions` 10, `api-users` 13.

UI specs (7 files, all passing on both browsers): `auth` 8, `bankaccounts` 4, `new-transaction` 10, `notifications` 7, `transaction-feeds` 20, `transaction-view` 6, `user-settings` 3.

Component specs: `TransactionsContainer.cy.tsx` 4 passed, `AlertBar.cy.tsx` 4 passed, `SignInForm.cy.tsx` 1 passed, `TransactionDateRangeFilter.cy.tsx` 2 passed / 1 failed, `TransactionTitle.cy.tsx` 1 passed.

`yarn lint` is `eslint && prettier --check "**/**.{ts,js,tsx}" "*.{json,md,yml}"`. ESLint finished clean and Prettier reported "All matched files use Prettier code style!".

## Known failure

### Component: defined date-range chip renders `Date: undefined`

- Command: `yarn test:component:ci`
- Spec: `src/components/TransactionDateRangeFilter.cy.tsx`
- Test: `should render a defined date range filter`
- Browser: Electron 146 (headless)
- Attempts: 3 (`retries.runMode` is 2 in `cypress.config.ts`)
- Assertion: the chip `[data-test='transaction-list-filter-date-range-button']` should contain `Jan, 1 2018` (and the formatted end date)
- Actual: the chip text is `Date: undefined`
- Classification: application bug

`TransactionDateRangeFilter` treats `dateRangeFilters` as active when `hasDateQueryFields` is true, and then labels the chip from `calendarValue`. That state is created with `useState(null)` and is only set in `onCalendarSelect`, after a calendar pick. The mounted `dateRangeStart` / `dateRangeEnd` props are never copied into `calendarValue`, so `dateRangeLabel(null)` contributes the string `undefined`. The failure screenshot shows the chip reading `Date: undefined`. The VM timezone was UTC; the chip is missing the range, which is a logic gap in the component.

`SignInForm.cy.tsx` also logged React warnings about SVG `stop-color` and `stop-opacity` on `SvgCypressLogo`. That spec passed.

## Skipped unit tests

These are skipped in source. They are not failures.

- `src/__tests__/generateSeedData.test.ts` uses `describe.skip("Seed Database")`, so all 8 tests in that file are skipped. The file has no comment saying why.
- `src/__tests__/transactions.test.ts` has two `it.skip` cases: creating a payment plus a withdrawal for the remaining balance, and creating a request plus a withdrawal for the remaining balance. No comment says why.

## Auth-provider specs

`cypress/tests/ui-auth-providers/{auth0,okta,cognito,google}.spec.ts` register their suites only when `Cypress.expose` reports the provider as configured. `cypress.config.ts` sets those flags from `auth0_username`, `okta_username`, `cognito_username`, and `googleClientId`. None of those credentials were in the environment, so each file loaded and reported 0 tests. The command exited 0.

Twelve `it()` blocks stay inside those guards (Auth0 2, Okta 4, Cognito 4, Google 2). They were not executed. Classification: missing third-party credentials.

## Demo spec

`cypress/tests/demo/cypress-studio.spec.ts` has two tests, `create new transaction` and `create new bank account`. Each body is only the comment `// Extend test with Cypress Studio`. `beforeEach` seeds the database and logs in. Both tests passed in 4s of Cypress time. They do not assert the flows in their titles.

## Side effects on the JSON database

`yarn dev` rewrites `data/database.json` from the seed. Cypress end-to-end tests mutate it further. After the UI suite, the first seeded user (`Heath93`) had first name, last name, email, and phone updated by `user-settings.spec.ts`. That file is tracked. Restore it with `git checkout -- data/database.json` before committing other work. It was restored after this baseline and is not part of the diff.

## Unverified

- Firefox UI, desktop and mobile. Firefox is not installed. CI jobs: `ui-firefox-tests`, `ui-firefox-mobile-tests`.
- Mobile viewport on Chrome (`yarn cypress:run:mobile`, 375×667). CI jobs: `ui-chrome-mobile-tests`.
- Percy visual snapshots (`@percy/cypress`). No `PERCY_TOKEN`.
- Cypress Cloud recording (`record: true` in CI). No `CYPRESS_RECORD_KEY` / project record setup.
- Production-build UI path. CI runs `yarn build:ci` and then `yarn start:ci` (`scripts/testServer.ts` plus the API). This baseline served the app with `yarn dev` (Vite dev server plus the API), which is the README path. `yarn build` and `yarn build:ci` were not run.
- Coverage: `yarn dev:coverage` and `yarn cypress:run --env coverage=true`.
- Third-party auth app modes: `yarn dev:auth0`, `yarn dev:okta`, `yarn dev:cognito`, `yarn dev:google`.
- API, component, demo, and auth-provider specs on Chrome. UI on Chrome matched the Electron UI result (58 passed). The component failure is the chip text `Date: undefined`, which does not depend on the browser.
