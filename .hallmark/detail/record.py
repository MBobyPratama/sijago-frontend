from pathlib import Path
import json
r=Path('.hallmark/detail')
(r/'preflight.json').write_text(json.dumps({'scanned':'2026-10-28','scope':'app','findings':{'font':'src/app/layout.tsx: Plus Jakarta Sans','palette':'src/app/public-map/tokens.css: SIJAGO tokens','framework':'package.json: Next.js 15, React 19','requirements':'sijago-docs/PRD.md FR-4.3 through FR-4.6 and FR-10.1 through FR-10.6'},'preserve':['existing report data and handlers','brand tokens','map component','shared footer'],'introduce':['report hierarchy','scoped CSS','real API photo rendering','OTP keyboard focus management'],'before':'Static inventory saved; before screenshots unavailable due browser launch failure.'},indent=2))
entry={'mode':'redesign','depth':'full','scope':'app','shape':'report record with evidence and community actions','theme':'brand','axes':'cool/sans/blue','hero':'none, app screen','nav':'SIJAGO resident navigation','footer':'kept project footer','imagery':'API report BEFORE, REPORT, AFTER photos only','photos':[],'entry':'read and participate in a public road report','fingerprint':['report identity','left narrative evidence and community','right facts and map','OTP modal'],'sections':['report identity','description and support','evidence','condition tags','community signoff','facts and location'],'signature':'public road report evidence and resident participation','waived':[],'prompt':'Redesign report detail following sijago-docs, retaining Plus Jakarta Sans, SIJAGO colors and functions'}
(r/'entry.json').write_text(json.dumps(entry,indent=2))
(r/'handoff.md').write_text('''# Detail laporan SIJAGO

Full app redesign in src/app/laporan/[id]/page.tsx and detail.css; resident navbar also applies to /laporan/ routes. Existing 1 link and 12 handlers retained, Plus Jakarta Sans and SIJAGO tokens unchanged. Shared footer retained.

Changed layout: report identity, open narrative and evidence column, facts/map sidebar, clear condition selection and community rating. BEFORE and REPORT are shown as original-condition evidence; AFTER as repair evidence. Missing evidence is explicitly stated, no substitute photograph invented.

Technical identifiers, emojis used as icons, uppercase labels, and provider/database jargon were removed from display copy. Original facts, threshold (minimum 3 votes and more than 50%), 30-day monitoring, OTP explanation, fields, condition values and vote values retained. Existing simulation handlers retained. API prefix normalized because apiFetch already uses /v1 base.

Finish review: mobile narrative now precedes facts/map; OTP traps focus, supports Escape and restores focus; map location text remains available if external tiles do not load. Map tiles depend on the existing external provider.

Before screenshot capture failed; static before inventory available. Do not represent this run as a verified visual before/after comparison. Final rendered lint and screenshot set are in .hallmark/shots. No decorative asset slots required; actual report evidence is the useful material.
''')
(r/'.gitignore').write_text('build-check/\nbefore-source.tsx\n*.png\n')
