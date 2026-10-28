# Moderasi SIJAGO

Full app redesign: src/app/admin/moderasi/page.tsx, new moderasi.css, and a route-specific admin navigation branch in DemoNavbar.tsx. Existing resident pages and other admin routes retain their behavior. Plus Jakarta Sans and shared SIJAGO tokens remain.

Preserved all 10 route destinations, four existing fields, agency codes and addresses, and actions: refresh, selection, verification, merge, rejection, public photo blur, agency selection and confirmed escalation. API path prefix normalized because apiFetch already supplies /v1. Existing payload keys remain (adminNote, masterTicketCode, reasonCode/reasonDetail, blurred, agencyCode).

Handlers recorded as refactored: rejection now runs via an explicit action and confirmation after selecting a reason; modal opening also records its focus trigger; queue selection also moves focus/scroll to inspection on mobile. Functions are preserved. Internal feature numbers, provider/database-oriented labels and oversized technical headings were replaced with task labels. FR-5.12 stays represented by photo privacy action and API endpoint. Initial seeded admin note was removed from the editor so unrelated reports never inherit it; server notes are loaded by selection.

New behavior: query/status/priority filters, empty queue without false sample details, loading placeholders, explicit demo mode when initial API load fails, retained data labelled stale after refresh failure, no fabricated successful mutation on API errors. A sample cannot mutate real records or claim email delivery. Success follows server confirmation. Email preview distinguishes actual and simulated sending; failure keeps preview open for retry. Merge and rejection are confirmed. Photo preview uses only API publicUrl; no claim of access to original EXIF/original secure URL. Missing photos stated plainly.

Finish review: denser report records, collapsible read-only facts, verification action alongside decision heading, mobile focus and return path, stale-data badge, simulated-delivery disclosure. Four findings resolved against recaptures. No marketing imagery or unfilled decorative slots; report evidence is the useful material.

Verification: 39 mocked API browser checks (no real mutations or emails), responsive overflow checks 320/375/768/1024/1440/1920, modal focus/Escape/restore, mobile focus/scroll, actual failure and empty responses, all action payloads. Typecheck and production build tracked separately. Final visual comparison: ../compare.html.

Production build passed in isolated copy. Final source typecheck passed after mobile navigation improvement. Temporary build directory removed.
