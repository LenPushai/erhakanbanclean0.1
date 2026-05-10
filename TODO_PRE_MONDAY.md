# Pre-Monday Cutover TODOs

Tracking items that must be addressed before the Monday user go-live following the e-sign v1 build (US-012 + US-013, target tag `e-sign-v1-2026-05-08`).

These were surfaced during the US-012 pre-flight audit (see ADR-006 Reconciliation Note + Lifecycle Integration Addendum) and explicitly deferred from the e-sign v1 scope.

---

## US-014b -- Remove email override

**File:** `api/send-email.js` (~line 43)
**Issue:** All outbound emails are currently hard-overridden to `lenklopper03@gmail.com` regardless of the `to` field in the request body. This is testing infrastructure that lets Stage 1 smoke-test land in Len's inbox without bothering Hendrik. The same override is mirrored server-side inside `api/sign-submit.js` for the Stage 2 customer email it dispatches.
**Action:** Remove the override line in `api/send-email.js`. Remove the mirrored override in `api/sign-submit.js`'s `sendCustomerSignEmail`. Verify production sends route correctly to per-recipient addresses.
**Required before:** any production smoke test or Monday go-live.

---

## US-014c -- Reconcile JUANIC/Jeanic spelling

**Files:** `src/App.tsx` (VALID_ROLES, ROLE_DISPLAY_NAMES, role equality checks); any future RBAC gates referencing the role string.
**Issue:** Internal role enum value is 'JUANIC' while the display name and human spelling is 'Jeanic'. The e-sign v1 button gating uses the inconsistent value deliberately to avoid bundling unrelated cleanup into this build.
**Action:** Pick one canonical spelling and reconcile across the codebase. Likely 'JEANIC' everywhere with 'Jeanic' for display.
**Risk if delayed:** every new RBAC gate added compounds the inconsistency.

---

## emailQuoteReady -- wrong column reference (always renders dash)

**File:** `src/emailService.ts` `emailQuoteReady`
**Issue:** Reads `rfq.quote_value_excl` but the populated column is `rfq.quote_value_excl_vat`. The `quote_value_excl` column is legacy and always null, so the email silently renders the value as a dash instead of the actual quote total.
**Action:** Change `rfq.quote_value_excl` to `rfq.quote_value_excl_vat` in the body of `emailQuoteReady`. Verified the live schema 2026-05-08: only `quote_value_excl_vat` and `quote_value_incl_vat` are populated (11 of 12 RFQs).
**Required before:** any production smoke test where the manager-approval-pending email goes to a real recipient.

---

## Schema cleanup -- legacy quote_value columns

**Tables:** `rfqs`
**Issue:** Three columns are always null and superseded by `quote_value_excl_vat` / `quote_value_incl_vat`:
- `quote_value`
- `quote_value_excl`
- `quote_value_incl`
**Action:** Confirm no code reads from them, then drop. Post-Monday work, non-blocking.

---

## VITE_APP_URL -- Vercel environment variable

**Required before any production smoke test.**
**Action:** In Vercel dashboard, Project Settings, Environment Variables, add:
- Name: `VITE_APP_URL`
- Value: `https://erhakanbanclean0-1.vercel.app` (or the active production URL)
- Environments: Production, Preview, Development
**Reason:** The e-sign emails embed an absolute review-and-sign link constructed from this variable. The serverless function `api/sign-submit.js` reads it from `process.env.VITE_APP_URL` and fails loudly if missing. The React side falls back to `window.location.origin` if absent, but only the serverless function dispatches the Stage 2 customer email -- so a missing prod env breaks Stage 2 end-to-end.
