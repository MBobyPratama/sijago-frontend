from pathlib import Path
import json
r=Path('.hallmark/theme-guide')
(r/'preflight.json').write_text(json.dumps({'scanned':'2026-10-28','scope':'app','findings':{'font':'src/app/layout.tsx:7 Plus Jakarta Sans','palette':'src/app/public-map/tokens.css:3 shared SIJAGO brand tokens','controls':'src/app/lapor/lapor.css, src/app/lacak/lacak.css, src/app/laporan/[id]/detail.css','framework':'package.json Next.js 15 / React 19','rules':'sijago-docs/UI_UX_GUIDE.md and PRD.md'},'preserve':['clipboard actions','category filter IDs','all route destinations','six mandatory governance texts verbatim','existing SIJAGO palette and Plus Jakarta Sans'],'introduce':['actual resident typography and tokens','interactive local component specimens','resident navigation','honest clipboard failure state']},indent=2),encoding='utf-8')
entry={'mode':'redesign','depth':'full','scope':'app','shape':'indexed living component reference','theme':'brand','axes':'cool/sans/blue','hero':'none, reference app screen','nav':'SIJAGO resident shell plus local index','footer':'kept editorial project footer','imagery':'existing SIJAGO header logo','photos':[],'entry':'reference resident UI tokens and patterns','fingerprint':['local category index','open swatch catalog','typographic specimens','interactive local form states','governance copy','route directory'],'sections':['colors and status','typography and layout','resident components','governance','directory'],'signature':'actual resident tokens and interactive state specimens','waived':[],'prompt':'Update theme guide to match newly redesigned resident pages','verification':{'browserChecks':28,'requests':'clipboard mocked, local component state only'}}
(r/'entry.json').write_text(json.dumps(entry,indent=2),encoding='utf-8')
(r/'handoff.md').write_text('''# Theme guide SIJAGO

Updated src/app/theme-guide/page.tsx, created theme-guide.css, and extended DemoNavbar resident shell to /theme-guide. No routes removed. All 11 destinations and 6 original handlers retained. Clipboard now reports success only after write succeeds and shows failure information when unavailable.

The guide now reads actual resident font and color tokens from public-map/tokens.css. Inter and JetBrains Mono references were replaced by Plus Jakarta Sans. Primary action uses blue, civic/AI colors communicate information. Open separators replace nested shadow cards. Current resident form controls, focus, selection, approval, loading, empty, error and success examples are documented. Examples change only local preview state, never send a real report.

The six mandatory governance copy strings remain verbatim, including consent, hash invalidation, technical recommendation disclaimer and repair-authority disclaimer. Previous headings have been tightened and obsolete Figma/wireframe framing removed. Admin and agency routes and descriptions are retained, separate from the resident visual reference. Marker palette retained; closed status added from UI_UX_GUIDE.md. Example dimensions and signoff threshold retained as explicitly illustrative data.

No stock imagery or missing decorative slots. Existing logo assets reused. Before and after screenshots and compare.html are in .hallmark. Build and browser verification are recorded separately.
''',encoding='utf-8')
(r/'.gitignore').write_text('build-check/\nbefore-source.tsx\n*.png\n',encoding='utf-8')
