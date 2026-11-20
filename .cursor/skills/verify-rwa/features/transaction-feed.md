# Transaction feed

The transaction feed lets a signed-in user switch Everyone, Friends, and Mine, narrow Everyone to a date range chosen on the calendar, clear that range, and open the amount slider.

## Sub-features

- `feed-tabs` selects Everyone (`/`), Friends (`/contacts`), and Mine (`/personal`).
- `feed-date-pick` chooses two days on the visible calendar and filters Everyone.
- `feed-date-remount` keeps that formatted range when switching Everyone, Friends, and Mine.
- `feed-date-clear` returns the chip to `Date: ALL` and the first page of public transactions.
- `feed-amount-open` opens the amount slider. Applying a range by dragging is not part of this recipe.

## How to get to it (user POV)

- Sign in. Everyone is the home page.
- Choose the `Friends` or `Mine` tab.
- Choose the `Date: ALL` chip, then two days on the calendar. Choose the amount chip to see the slider.

## Driving it with Cypress

Preconditions:

- `verify-rwa doctor` is `doctor-ok` for this run's pid.
- The database is the committed seed. Public transactions exist, and none of them fall on the current month (seed transactions end in March 2024).
- Page size is `PAGINATION_PAGE_SIZE=10`.
- `drive transaction-feed` runs `.cursor/skills/verify-rwa/specs/transaction-feed.cy.ts`.

- **Sign in on Everyone.** Sign in as Heath93 through the form. `[data-test=nav-public-tab]` has class `Mui-selected`. `[data-test=transaction-list-filter-date-range-button]` contains `ALL`. `[data-test^=transaction-item]` has length 10.
- **Friends.** Click `[data-test=nav-contacts-tab]`. The pathname is `/contacts`, the tab is selected, and `[data-test=transaction-list]` is visible.
- **Mine.** Click `[data-test=nav-personal-tab]`. The pathname is `/personal` and the list is visible. Click `[data-test=nav-public-tab]` to return to `/` before filtering.
- **Pick a range.** Click `[data-test=transaction-list-filter-date-range-button]`. `.react-calendar` is visible. Click the first and third in-month day buttons (`.react-calendar__month-view__days__day` without `--neighboringMonth`). The calendar closes. The date chip matches `Date: MMM, d yyyy - MMM, d yyyy` (for example `Date: Nov, 1 2026 - Nov, 3 2026`). It does not contain `undefined` or `ALL`. The next `GET /transactions/public` URL contains `dateRangeStart`. `[data-test=empty-list-header]` contains `No Transactions`.
- **Range survives a tab switch.** Click `[data-test=nav-contacts-tab]`. The pathname is `/contacts` and the tab is selected. The date chip text is the same formatted range. The next `GET /transactions/contacts` URL contains `dateRangeStart`. Click `[data-test=nav-personal-tab]`. The pathname is `/personal` and the chip text is unchanged. The next `GET /transactions` URL contains `dateRangeStart`. Click `[data-test=nav-public-tab]`. The pathname is `/` and the chip text is unchanged. The next `GET /transactions/public` URL contains `dateRangeStart`.
- **Clear.** Click `[data-test=transaction-list-filter-date-clear-button]`. The chip contains `ALL` and ten transaction items are back.
- **Open the amount slider.** Scroll `[data-test=transaction-list-filter-amount-range-button]` into view, then click it. `[data-test=transaction-list-filter-amount-range-text]` contains `Amount Range:` and `[data-test=transaction-list-filter-amount-range-slider]` is visible.
- **Proof.** Screenshots `01-everyone` through `10-amount-slider` plus `.aria.txt`. `side-effect.json` records the chip text after the pick and after each tab switch, `dateChipAfterCalendarPickContainsUndefined: false`, `dateChipAfterTabSwitchContainsUndefined: false`, and `amountSliderOpened: true`. This journey does not write a transaction.

## Gotchas

- The date chip shows the active range after a calendar pick and after switching Everyone, Friends, and Mine. A tab switch remounts the filter; the chip text stays `Date: MMM, d yyyy - MMM, d yyyy`. `Date: undefined` is a failure. Assert the full chip text, including after the tab switch.
- `cy.pickDateRange` calls `cy.clock` before it clicks the calendar. That is not this recipe. Click the day buttons.
- `cy.setTransactionAmountRange` invokes the slider's React `onChange`. Opening the slider is the proof this recipe owns. A drag that never moves the pointer is not a verified amount filter.
- `cy.nextTransactionFeedPage` pages by sending XState `FETCH`. Scrolling the list is the user path; this recipe stops at the first page of 10.
- The clear control is the small icon on the chip (`[data-test=transaction-list-filter-date-clear-button]`). The repo's own end-to-end spec clicks it with `{ force: true }` because the icon is easy to miss. The recipe does the same click.
