# Lapor redesign

One app screen, /lapor. Plus Jakarta Sans and SIJAGO brand tokens preserved.

All 15 rendered links, 11 initial fields, and 20 handlers preserved. Additional stages retain template fallback, readonly drafts, approval invalidation, explicit approval, final submission, ticket tracking and audit links. Demo controls moved into disclosures; seeded input and simulated completion now labeled explicitly. A failed actual submission stays on review with an error instead of falsely showing success.

36 functional checks passed against intercepted API responses; no real reports were submitted. Checks cover real compression/registration handler, fallback template, outside-city guard, copy-street control, data mutation, stale approval reset, server rejection, network failure, success ticket, idempotency and 320 to 1920px layouts. Live Cloudinary/OpenAI/backend integration was not validated by these tests.

Finish review: 2 findings resolved, size criteria rendered below select and dimension input tops aligned. No photo slots added; the real user-upload preview is the only new picture surface. No further user assets required.

Copy: technical implementation badges replaced with plain task labels. Consent wording retained. Location and no-login information moved from the original long title to its supporting sentence. API-generated report content is unchanged.

Comparison: ../compare.html.
