## Summary

<!-- What changed and why, in a few sentences. -->

## Linked issue / task

<!-- Link the issue or task. If there is no tracker item, write "none" and name the request. -->

## Checks

<!-- Run the commands in AGENTS.md. Fill the result column (pass or fail, with counts). -->

| Check     | Command                                        | Result |
| --------- | ---------------------------------------------- | ------ |
| Types     | `yarn types`                                   |        |
| Lint      | `yarn lint`                                    |        |
| Unit      | `yarn test:unit:ci`                            |        |
| API       | `yarn test:api`                                |        |
| Component | `yarn test:component:ci`                       |        |
| E2E       | `yarn cypress:run --spec 'cypress/tests/ui/*'` |        |

## verify-rwa evidence

<!-- Required when the change is user-facing. Name the feature (`sign-in`, `send-payment`, `transaction-feed`, `notifications`, `bank-accounts`) and what you observed (action, resulting screen, database side effect). Write "not user-facing" when the skill does not apply. -->

- Feature:
- Observed:

## Still unverified

<!-- What you did not run, and why. -->
