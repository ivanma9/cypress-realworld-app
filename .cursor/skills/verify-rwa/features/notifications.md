# Notifications

Notifications lets Heath93 read the unread count, dismiss one item so it stays gone, then like and comment on someone else's transaction and see those notices on that person's notification list.

## Sub-features
- `notifications-badge` shows 8 unread items for a seeded user.
- `notifications-dismiss` marks one notification read and drops it from the list.
- `notifications-like` likes a transaction Heath93 has not liked.
- `notifications-comment` comments `Verification comment` and the other person sees both events.

## How to get to it (user POV)
- Sign in and choose the bell in the top bar, or `Notifications` in the sidenav.
- Open a transaction, choose Like, and submit `Write a comment...` with Enter.
- Sign out and sign in as the other person, then open the bell again.

## Driving it with Cypress
Preconditions:
- `verify-rwa doctor` is `doctor-ok` for this run's pid.
- The database is the committed seed. Heath93 (`uBmeaz5pX`) has 8 unread notifications, all `isRead: false`.
- There is a transaction whose sender and receiver are both someone other than Heath93, and Heath93 has not liked it. The spec reads `data/database.json` only to choose that id, then opens `/transaction/<id>`, which is the route a feed item navigates to.
- `drive notifications` runs `.cursor/skills/verify-rwa/specs/notifications.cy.ts`.

- **Badge.** Sign in as Heath93 through the form. `[data-test=nav-top-notifications-count]` has text `8`.
- **Open the list.** Click `[data-test=nav-top-notifications-link]`. The pathname is `/notifications`, the heading is `Notifications`, and `[data-test^=notification-list-item]` has length 8.
- **Dismiss.** Click `[data-test=notification-mark-read-<id>]` on the first item (the button text is `Dismiss` above the `xs` breakpoint). The list length is 7 and that id is gone. `cy.reload()` still shows 7 and the id is still gone.
- **Like and comment.** Sign in as Heath93, `cy.visit("/transaction/<id>")`, and wait for `[data-test=transaction-detail-header]`. The like button `[data-test^=transaction-like-button-]` is enabled. Click it. It becomes disabled. `cy.get("[data-test^=transaction-comment-input-]").type("Verification comment{enter}")`. `[data-test=comments-list]` contains `Verification comment`.
- **Other person.** Click `[data-test=sidenav-signout]`, sign in as the transaction sender through the form, and click the bell. The first `[data-test^=notification-list-item]` contains `Ted Parisian` and `commented`. The list also contains `liked`.
- **Proof.** Screenshots `01-badge` through `07-counterparty-notifications` plus `.aria.txt`. `side-effect-dismiss.json` has `isRead: true` and `unreadRemaining: 7`. `side-effect-like.json` has the new like id and comment id for Heath93 on that transaction.

## Gotchas
- `GET /notifications` returns unread rows only, newest `modifiedAt` first. Dismiss sets `isRead` and the row leaves the list. A success toast is not the proof. Reload and the database row are.
- The badge and the list are both the unread set. After one dismiss the badge is not re-checked; the list length and `isRead` are.
- `cy.switchUserByXstate` logs the next user out through XState. This recipe clicks Logout and types the next username.
- Like and comment notifications are created for the sender and the receiver. The sentence uses the actor's full name (`Ted Parisian liked a transaction.`), not the sidenav's `Ted P`.
- The comment field's `data-test` is on the native input (`transaction-comment-input-<transactionId>`). Enter submits it.
- If the seed has no transaction Heath93 can still like, stop. Do not like a transaction the file says is already liked and report that as this journey.
