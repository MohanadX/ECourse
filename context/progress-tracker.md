# Progress Tracker

Update this file after every meaningful implementation
change.

## Current Phase

- k6 Load Testing Setup (In Progress)

## Current Goal

- Setting up k6 load test environment with locally minted valid Clerk JWTs

## Completed

- Created local seeding script (`scripts/seed-local.ts`) to insert 500 test users and mint Clerk JWTs using the local private key.
- Wiped and seeded the database with deterministically named users.
- Generated `scripts/k6-users.json` with user tokens for use in k6.
- Implemented initial experimental k6 test script in `scripts/k6-test.js` testing `/` and `/api/coupon`.

## In Progress

- Discussing and identifying every high traffic route to test and see performance analytics.

## Next Up

- Expand k6 tests for high-traffic routes and analyze performance.

## Open Questions

- [Any unresolved product or technical decisions]

## Architecture Decisions

- [Decisions made that affect the system design or
  data model — include why the decision was made]

## Session Notes

- [Context needed to resume work in the next session]
