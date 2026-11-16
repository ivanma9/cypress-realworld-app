# Send or request a payment

Send or request a payment lets Heath93 pick Kristian Bradtke, pay $35 or request $95, see the confirmation, and find the same note on the Mine feed after a reload. The payment also moves both balances in the JSON database.

## Sub-features
- `pay-open` reaches the new-transaction form from the header New button and selects Kristian Bradtke.
- `pay-submit` pays $35 with a unique note and shows `Transaction Submitted!`.
- `pay-persist` lists that note on Mine after reload, with balances updated by 3500 cents.
- `request-submit` requests $95 and leaves both balances unchanged.

## How to get to it (user POV)
- Sign in as Heath93, then choose `New` in the top bar.
- Search `Kristian` and choose `Kristian Bradtke`.

## Driving it with Cypress
Preconditions:
- `verify-rwa doctor` is `doctor-ok` for this run's pid.
- The database is the committed seed (`POST http://localhost:3001/testData/seed`). Heath93 balance is `150953` cents and Arvilla_Hegmann (Kristian Bradtke) is `93026` cents.
- No transaction already uses the note this run generates (`Verify payment <timestamp>` or `Verify request <timestamp>`).
- `drive send-payment` runs `.cursor/skills/verify-rwa/specs/send-payment.cy.ts`.

- **Sign in.** `cy.visit("/signin")`, type `Heath93` into `[data-test=signin-username]`, type `s3cret` into `[data-test=signin-password]`, click `[data-test=signin-submit]`. The pathname is `/` and `[data-test=sidenav-username]` contains `@Heath93`.
- **Choose the receiver.** Click `[data-test=nav-top-new-transaction]`. The pathname is `/transaction/new`. `cy.get("[data-test=user-list-search-input]").type("Kristian")`, then `cy.contains("[data-test^=user-list-item]", "Kristian Bradtke").click()`.
- **Pay.** Type `35` into `[data-test=transaction-create-amount-input]` and the note into `[data-test=transaction-create-description-input]`. Click `[data-test=transaction-create-submit-payment]`. `[data-test=alert-bar-success]` contains `Transaction Submitted!`. The `h2` contains `Paid` and the note. `[data-test=sidenav-user-balance]` contains `$1,474.53`.
- **Confirm on Mine.** Click `[data-test=new-transaction-return-to-transactions]`, then `[data-test=nav-personal-tab]`. The pathname is `/personal` and `[data-test=transaction-list]` contains the note. `cy.reload()`, open Mine again, and the note is still there.
- **Request.** Repeat the form with amount `95`, click `[data-test=transaction-create-submit-request]`, and confirm the `h2` contains `Requested`. The balance stays `$1,509.53`. Mine contains the request note.
- **Proof.** Screenshots `01-signed-in` through `08-request-on-mine` plus matching `.aria.txt` files. `side-effect.json` is the payment: sender balance `147453`, receiver balance `96526`, transaction amount `3500`, status `complete`, and a notification row for the receiver. `side-effect-request.json` is the request: both balances unchanged, amount `9500`, `requestStatus` `pending`.

## Gotchas
- The form amount is dollars. The database amount is cents. A UI balance of `$1,474.53` is the proof people see; `side-effect.json` is the stored cents.
- `cy.createTransaction`, `cy.loginByXstate`, and `cy.loginByApi` do not count. The Pay and Request buttons are what submit the form.
- Kristian Bradtke's username is `Arvilla_Hegmann` and the user id is `GjWovtg2hr`. Search by the visible name.
- On a viewport below `sm`, the balance is behind the drawer toggle. This recipe uses desktop width, where `[data-test=sidenav-user-balance]` is on screen. Headless Electron screenshots are 1280×720.
- Heath93 already has a bank account, so the onboarding dialog does not block New. A brand-new user cannot pay until onboarding creates an account.
- Run the payment assertions against a fresh seed. A second pay without reseeding starts from `$1,474.53`, not `$1,509.53`.
