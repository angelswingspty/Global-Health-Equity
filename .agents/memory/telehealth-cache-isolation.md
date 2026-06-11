---
name: Telehealth React Query cache must be per-user
description: Why telehealth query keys are user-scoped and the cache is cleared on login/logout
---

# Telehealth React Query cache must be isolated per account

Any telehealth query that returns PHI (messages, appointments, documents, etc.) must use a
query key scoped to the current user, e.g. `["getMessages", user?.id]`, NOT a bare
`["getMessages"]`. The auth context (`TelehealthAuthContext`) also calls `queryClient.clear()`
in **both** `login` and `logout`.

**Why:** React Query caches by key. With a shared key like `["getMessages"]`, after one user
logs out and another logs in on the same browser, the new user briefly sees the previous user's
cached messages until the refetch resolves — a real cross-user PHI/confidentiality leak. Found in
code review of the secure-messaging rework.

**How to apply:** When adding/editing any telehealth data hook, scope the queryKey by `user?.id`
and match the same key in `invalidateQueries` after mutations. Keep the `queryClient.clear()`
calls in the telehealth login/logout transitions. The volunteer portal has a separate auth
context — apply the same rule there if its queries ever carry sensitive data.
