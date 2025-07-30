# @mcansh/vitest-response-matchers

## 0.1.0

### Minor Changes

- 63750c9: add vitest response matchers package

  initial set of matchers is the following
  - `toHaveBody` - check that a Response has a body attatched to it
  - `toHaveCookies` - check that a Response has any cookies, specified cookies, or a perfect match
  - `toHaveHeader` - check that a Response has a specific header (and value)
  - `toHaveJsonBody` - check that a Response's body matches the expected json
  - `toHaveStatus` - check that a Response's status matches
  - `toHaveStatusText` - check that a Response's statusText matches
  - `toHaveStrictStatusText` - a stricter version of the above that uses `node:http` to look up the status text
  - `toHaveTextBody` - check that a Response's body matches the expected text
  - `toMatchResponse` - check that a complete Response matches
  - `toThrowResponse` - check that a function throws a Response
