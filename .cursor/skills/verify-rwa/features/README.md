# Real World App verification map

This directory is the maintained source for verifying the user-facing behavior of the Cypress Real World App. Read the index before driving the app, then use the matching feature file as the recipe.

## Baseline preconditions
- Launch with `.cursor/skills/verify-rwa/bin/verify-rwa launch`. The frontend is `http://localhost:3000` (Vite dev) and the API is `http://localhost:3001`.
- `yarn dev` copies `data/database-seed.json` onto `data/database.json`. Password for every seed user is `s3cret`.
- Run `.cursor/skills/verify-rwa/bin/verify-rwa doctor` and require `doctor-ok`, the Vite dev title, and launch-pid ownership of ports 3000 and 3001.
- Never drive an instance that was not started by this verification run. A second instance cannot be isolated.

## Driving conventions
- Start every recipe from the seeded database. `drive` posts `POST http://localhost:3001/testData/seed` first. That is the repo's own reset (`cy.task("db:seed")`), not a shortcut around the screen.
- Viewport is set to 1280×1000. Cypress 16 headless Electron saves screenshots at 1280×720, which is still wide enough for the desktop sidenav. Prefer `data-test` selectors. The repo helper `cy.getBySel` is the same attribute.
- Sign in by typing the username and `s3cret` into the sign-in form.
- Restore the seed during cleanup. Do not remove proof artifacts during cleanup.
- Do not run `yarn db:seed`. That regenerates `data/database-seed.json` and changes user ids.

## Proof and skip reporting
- Capture the user action and the resulting state, not only the final screen.
- UI proof includes the `<step>.aria.txt` dump and a screenshot that shows the Cypress Real World App title or header logo.
- Mutation proof includes a read of `data/database.json` written to `side-effect.json` after the UI shows the result.
- Record the feature id and entry point in that JSON.
- Report an unreachable path with the attempted command and the unmet precondition.
- Do not report a skipped entry point as verified through a different path.

## Feature entry contract
Each feature file: H1 title, one paragraph, then exactly four H2s in order: `Sub-features`, `How to get to it (user POV)`, `Driving it with Cypress` (starts with `Preconditions:`, labeled bullets pairing each user action with an exact command and observable result), `Gotchas`. Keep implementation details out of the map.

## Features
- [Sign in](./sign-in.md)
- [Send or request a payment](./send-payment.md)
- [Transaction feed](./transaction-feed.md)
- [Notifications](./notifications.md)
- [Bank accounts](./bank-accounts.md)
