# Sign in

Sign in lets a visitor who is sent to a private page land on the sign-in form, see a rejected password, sign in as a seed user, stay signed in across a reload, and sign out.

## Sub-features
- `sign-in-redirect` sends an anonymous visit to `/personal` to `/signin`.
- `sign-in-error` shows `Username or password is invalid` for a bad password.
- `sign-in-session` keeps `@Heath93` and the balance after reload when Remember me is checked.
- `sign-in-sign-out` returns to `/signin` from Logout.

## How to get to it (user POV)
- Open `http://localhost:3000/personal` while signed out.
- Use `Don't have an account? Sign Up` only for the separate signup flow. This recipe does not create a user.

## Driving it with Cypress
Preconditions:
- `verify-rwa doctor` is `doctor-ok` for this run's pid.
- `POST http://localhost:3001/testData/seed` has restored the committed seed. `drive sign-in` does this, then runs `.cursor/skills/verify-rwa/specs/sign-in.cy.ts`.
- Heath93's balance is still `150953` cents (`$1,509.53`).

- **Redirect.** `cy.visit("/personal")`. The pathname is `/signin`, the document title is `Cypress Real World App`, and the heading is `Sign in`.
- **Reject the password.** `cy.get("[data-test=signin-username]").type("Heath93")`, `cy.get("[data-test=signin-password]").type("INVALID")`, `cy.get("[data-test=signin-submit]").click()`. `[data-test=signin-error]` has text `Username or password is invalid`.
- **Sign in.** Clear both inputs, type `Heath93` and `s3cret`, `cy.get("[data-test=signin-remember-me]").find("input").check()`, then click `[data-test=signin-submit]`. The pathname is `/`. `[data-test=sidenav-username]` is `@Heath93`. `[data-test=sidenav-user-full-name]` is `Ted P`. `[data-test=sidenav-user-balance]` contains `$1,509.53`. The `connect.sid` cookie has an `expiry`.
- **Reload.** `cy.reload()`. The username and balance are unchanged.
- **Sign out.** `cy.get("[data-test=sidenav-signout]").click()`. The pathname is `/signin`.
- **Proof.** `captureStep` writes `01-redirected-to-sign-in` through `05-signed-out` (screenshot plus `.aria.txt`). `side-effect.json` records Heath93's id `uBmeaz5pX` and balance `150953`.

## Gotchas
- The drawer name is `Ted P` because the sidenav prints the first name and the first letter of the last name. The full name `Ted Parisian` is not on that node.
- `[data-test=signin-username]` and `[data-test=signin-password]` sit on the Material UI field. Typing the field works. Clearing uses `.find("input").clear()`.
- Remember me is what gives `connect.sid` an expiry. A session without it still signs in, but this recipe checks the expiry.
- `cy.loginByApi` and `cy.loginByXstate` are not this journey. `cy.login` types the same two fields and is the repo's form helper.
- An anonymous user with no bank account is a different journey (onboarding). Heath93 already has an account, so the onboarding dialog stays closed.
