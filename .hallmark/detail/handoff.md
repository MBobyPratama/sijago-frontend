# Detail laporan SIJAGO

Full app redesign in src/app/laporan/[id]/page.tsx and detail.css; resident navbar also applies to /laporan/ routes. Existing 1 link and 12 handlers retained, Plus Jakarta Sans and SIJAGO tokens unchanged. Shared footer retained.

Changed layout: report identity, open narrative and evidence column, facts/map sidebar, clear condition selection and community rating. BEFORE and REPORT are shown as original-condition evidence; AFTER as repair evidence. Missing evidence is explicitly stated, no substitute photograph invented.

Technical identifiers, emojis used as icons, uppercase labels, and provider/database jargon were removed from display copy. Original facts, threshold (minimum 3 votes and more than 50%), 30-day monitoring, OTP explanation, fields, condition values and vote values retained. Existing simulation handlers retained. API prefix normalized because apiFetch already uses /v1 base.

Finish review: mobile narrative now precedes facts/map; OTP traps focus, supports Escape and restores focus; map location text remains available if external tiles do not load. Map tiles depend on the existing external provider.

Before screenshot capture failed; static before inventory available. Do not represent this run as a verified visual before/after comparison. Final rendered lint and screenshot set are in .hallmark/shots. No decorative asset slots required; actual report evidence is the useful material.

Validation: production build passed; final typecheck passed; 24 browser checks with mocked API passed. Modal handler now calls openOtp to record and restore focus; action preserved. Final rendered review used 5 screenshots; static kept comparison records this handler refactor.
