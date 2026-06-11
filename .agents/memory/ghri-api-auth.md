---
name: GHRI API client auth
description: How the ghri-website frontend must attach auth to generated API hooks
---

# GHRI website API auth propagation

The shared `customFetch` (`lib/api-client-react/src/custom-fetch.ts`) only attaches an
`Authorization: Bearer` header when EITHER a global `setAuthTokenGetter` is configured,
OR per-call `request: { headers: { Authorization } }` options are passed.

In `ghri-website`, `setAuthTokenGetter` is NEVER called. The volunteer/coordinator token
lives in `VolunteerAuthContext` (localStorage `vol_token`) but is not wired into the client.

**Rule:** every generated hook used in the volunteer portal must pass auth explicitly.
- Query hooks: `useGetX({ request: { headers: { Authorization: Bearer token } } })`
- Mutation hooks: spread the same object alongside `mutation`:
  `useCreateX({ ...authHeaders, mutation: { onSuccess } })`
- Direct generated functions (e.g. `getVolEventRegistrations`) take `(id, RequestInit)` —
  pass `{ headers: { Authorization } }` directly, NOT `{ request: {...} }`.

**Why:** mutations without headers fail silently with 401 — they typecheck fine and the
GET on the same page works, so the bug is easy to miss. Several existing pages (e.g.
hours.tsx) only pass auth to the GET and not their mutations.

**How to apply:** when adding any volunteer-portal API call, attach auth at the call site.
If many pages need it, the cleaner long-term fix is to call `setAuthTokenGetter` once at
app bootstrap reading from localStorage (this app uses bearer tokens, not cookies).
