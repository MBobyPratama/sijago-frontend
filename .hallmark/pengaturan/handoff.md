# Pengaturan SIJAGO

Updated src/app/admin/pengaturan/page.tsx, added pengaturan.css, and extended the existing shared admin navbar branch to /admin/pengaturan. Plus Jakarta Sans, SIJAGO tokens, all ten destinations and five rendered fields retained. Both additional existing config state values (AI regenerate limit, reopen ratio percent) are now editable.

Grouped fields by duplicate detection, AI drafting, repair monitoring and weather. Each field has a visible label, explicit unit, help, technical key, validation and error association. Reduced vertical spacing and kept save controls accessible with sticky positioning. Unsaved changes can be discarded to the last loaded/saved baseline; internal link navigation and browser unload are guarded. Missing server keys are individually labelled as reference defaults. Initial load failure does not authorize saving defaults over server data.

API prefix corrected: apiFetch already contains /v1, so calls use /admin/config. Canonical backend seed keys are ai_max_regenerate_per_report and signoff_reopen_bad_ratio. Ratio is displayed as a percentage and sent as a 0–1 ratio; existing legacy alias keys are read and synchronized when present. Only changed parameters are sent, preventing unrelated reference defaults from overwriting server values. Existing value strings preserved otherwise.

Save success now appears only after successful server response; failures retain edits and do not falsely report CONFIG_UPDATED. Native form submission calls the same handleSave; savingRef prevents duplicate writes. Schema-driven updateConfig replaces the five repetitive field handlers; all editing behavior remains with validation added. No backend code or real system config values changed during testing.

Finish review: 2 findings resolved, internal navigation guarded and denser form with persistent Save. Browser verification: 37 checks with intercepted GET/PUT, no real database writes. Checks cover canonical/legacy values, percentage conversion, changed-only payload, validation, discard/reload, duplicate submits, failure and success, missing parameters, offline reference mode, focus labels, six viewport widths, cancelled and confirmed navigation. Hallmark render: 0 FAIL and 0 WARN, only existing-brand palette dismissal. Production build and final typecheck recorded separately. Compare: ../compare.html. No photo slots needed for this form.

Production build passed in isolated copy, final typecheck passed, temporary build copy removed.
