# Security Specification for Mock Mitra

## 1. Data Invariants
- A user's profile at `/users/{userId}` can only be accessed (read, write) by the authenticated user whose `uid` matches `{userId}`.
- Test records under `/users/{userId}/tests/{testId}` are owned by the specific user `{userId}` and cannot be queried, read, or modified by any other user.
- Any update to a user profile must use server timestamps for `updatedAt` field tracking, or must be validated with exact properties to avoid Ghost Fields.

## 2. The "Dirty Dozen" Payloads (Denial Proofs)
1. **Malicious Spoof Read**: User `A` attempts to get `/users/userB`. Correct behaviour: `PERMISSION_DENIED`.
2. **Malicious Spoof Write**: User `A` attempts to write/overwrite `/users/userB`. Correct behaviour: `PERMISSION_DENIED`.
3. **Unauthenticated List Query**: Anonymous client attempts to list `/users`. Correct behaviour: `PERMISSION_DENIED`.
4. **Malicious Test Log Injection**: User `A` attempts to insert test result in `/users/userB/tests/test1`. Correct behaviour: `PERMISSION_DENIED`.
5. **Private Leak Bypass**: User `B` requests `/users/userA/tests`. Correct behaviour: `PERMISSION_DENIED`.
6. **No Auth Creation**: Anonymous client attempts to create `/users/tempUser`. Correct behaviour: `PERMISSION_DENIED`.
7. **Ghost Field Poisoning**: User `A` tries to inject a hidden field like `isAdmin: true` into their own `/users/{uid}`. Correct behaviour: `PERMISSION_DENIED` via `affectedKeys()`.
8. **Malicious Timestamp Spoofing**: User `A` sends a future custom timestamp instead of `request.time` for `updatedAt`. Correct behaviour: `PERMISSION_DENIED`.
9. **Null Auth Read**: A public request to list `/users` without auth header. Correct behaviour: `PERMISSION_DENIED`.
10. **ID Character Exploitation**: User `A` attempts to write to `/users` with a 1.5KB long malicious path. Correct behaviour: `PERMISSION_DENIED` via `isValidId()`.
11. **Immutability Breach**: User `A` tries to update the immutable `email` or `createdAt` field on `/users/{uid}`. Correct behaviour: `PERMISSION_DENIED`.
12. **Out of Range Accuracies**: User `A` attempts to set a negative streak or extreme value to poison the dashboard analytics. Correct behaviour: `PERMISSION_DENIED`.

---

## 3. Test Runner Specification
(Verified natively via compilation checks of rules and firebase services.)
