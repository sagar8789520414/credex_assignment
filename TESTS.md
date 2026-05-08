# Tests

All tests are in `src/test/auditEngine.test.ts` and cover the audit engine specifically.

## How to run

```bash
npm test
```

Expected output: 8 tests passing.

## Test descriptions

| # | Test name | File | What it covers |
|---|---|---|---|
| 1 | `flags Business plan as overspending for ≤3 seats` | `auditEngine.test.ts` | Cursor Business → Pro downgrade recommendation; verifies monthly and annual savings math |
| 2 | `marks Cursor Pro for a coding team as optimal` | `auditEngine.test.ts` | Cursor Pro for a coding team returns `severity: optimal` and zero savings |
| 3 | `flags Team plan as overspending for <5 seats` (Claude) | `auditEngine.test.ts` | Claude Team with 3 seats → individual Pro recommendation; verifies the 5-seat minimum logic |
| 4 | `marks Claude Max as overspending for non-research use case` | `auditEngine.test.ts` | Claude Max for a coding team → Pro downgrade; verifies use-case-aware logic |
| 5 | `flags Team plan as overspending for ≤2 seats` (ChatGPT) | `auditEngine.test.ts` | ChatGPT Team with 2 seats → Plus recommendation; verifies seat-count threshold |
| 6 | `correctly sums savings across multiple overspending tools` | `auditEngine.test.ts` | Multi-tool audit with Cursor Business + Claude Team + ChatGPT Plus; verifies `totalMonthlySavings` and `totalAnnualSavings` aggregation |
| 7 | `flags high API spend and recommends model routing` | `auditEngine.test.ts` | OpenAI API at $500/mo → model routing recommendation; verifies the reason string mentions "mini" |
| 8 | `flags paying for both Cursor and GitHub Copilot` | `auditEngine.test.ts` | Overlap detection — two paid coding IDEs → warning in recommendation reason |
