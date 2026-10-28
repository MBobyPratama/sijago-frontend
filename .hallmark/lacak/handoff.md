# Lacak redesign

One tracking app screen. Plus Jakarta Sans, existing SIJAGO tokens, and existing navigation destinations preserved. All 13 rendered links, one search field, and both original input/sample handlers retained.

Unknown codes no longer fall back to the first unrelated sample. Existing sample fallback only matches the requested code and is labeled. Missing live draft and agency fields no longer borrow sample content. Missing dates remain unspecified, use WIB when present. Rejection and duplicate stages stop consistently; reopened and closed stages supported. API photos render as evidence only when supplied.

Document/PDF and detail links are above the timeline on desktop and mobile. Unsubscribe was previously an inert span, now accurately directs the user to the notification email; no new unsubscribe endpoint is claimed.

36 browser checks passed using mocked API responses, with no data mutations. Tests cover live lookup, query initialization, empty, not-found, server errors, offline, missing values, terminal statuses, photo evidence, samples, loading, stale-response race, document links, responsive widths 320 to 1920. Actual email delivery, PDF response and live backend integration were not tested.

Finish review: 2 findings resolved (terminal descriptions and mobile action placement). No photo slots or new user assets needed. Comparison: ../compare.html.
