# Bank accounts

Bank accounts lets Heath93 open the seeded account, create a second one, and soft-delete the new one so the original remains.

## Sub-features
- `bank-list` shows Waters, King and O'Reilly Bank and no onboarding dialog.
- `bank-create` saves The Best Bank from `/bankaccounts/new`.
- `bank-delete` marks that new account `(Deleted)` and leaves the original active.

## How to get to it (user POV)
- Sign in, then choose `Bank Accounts` in the sidenav.
- Choose `Create` (`[data-test=bankaccount-new]`) and submit the form.
- Choose `Delete` on the new row.

## Driving it with Cypress
Preconditions:
- `verify-rwa doctor` is `doctor-ok` for this run's pid.
- The database is the committed seed. Heath93 has one account, id `pgl34JtnfhX`, bank name `Waters, King and O'Reilly Bank`, `isDeleted` false. No account is named `The Best Bank`.
- `drive bank-accounts` runs `.cursor/skills/verify-rwa/specs/bank-accounts.cy.ts`.

- **Open the list.** Sign in as Heath93 through the form. `[data-test=user-onboarding-dialog]` does not exist. Click `[data-test=sidenav-bankaccounts]`. The pathname is `/bankaccounts`. `[data-test=bankaccount-list]` contains `Waters, King and O'Reilly Bank`.
- **Create.** Click `[data-test=bankaccount-new]`. The pathname is `/bankaccounts/new` and `[data-test=bankaccount-form]` is visible. Type `The Best Bank` into `[data-test=bankaccount-bankName-input]`, `987654321` into `[data-test=bankaccount-routingNumber-input]`, and `123456789` into `[data-test=bankaccount-accountNumber-input]`. Click `[data-test=bankaccount-submit]`. Two `[data-test^=bankaccount-list-item]` rows are visible and one contains `The Best Bank`.
- **Delete.** On the `The Best Bank` row, click `[data-test=bankaccount-delete]`. That row contains `(Deleted)`. `cy.reload()`. The new row still contains `(Deleted)`. The Waters row does not.
- **Proof.** Screenshots `01-list` through `05-deleted-after-reload` plus `.aria.txt`. `side-effect.json` has the new account `isDeleted: true` and `pgl34JtnfhX` still `isDeleted: false`.

## Gotchas
- Delete is a soft delete. The row stays on screen with `(Deleted)` and the Delete button is gone. A missing row is not what this screen does.
- Bank name must be at least 5 characters. Routing number is 9 digits. Account number is 9 to 12 digits. Shorter values keep `[data-test=bankaccount-submit]` disabled. This recipe uses values that pass.
- The onboarding dialog opens when the signed-in user has no bank account. Heath93 has one. If the dialog is open, this list journey has the wrong user; do not dismiss it and continue as if the list were reachable.
- Creating the account goes through GraphQL from the form. Wait for `The Best Bank` to appear in the list. A network stub that empties `listBankAccount` is how the empty-state test works, and it is not this journey.
