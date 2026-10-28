# Portal instansi SIJAGO

Updated src/app/instansi/laporan/page.tsx, created laporan-instansi.css and route-specific agency navigation in DemoNavbar using the shared admin-navigation.css recipe. Plus Jakarta Sans, SIJAGO tokens, all ten destinations, original six fields, status options, agency codes and local demonstration controls retained. No backend changes.

The new workspace separates ticket selection and follow-up form. Added local search/status filters, explicit loading/empty/error/stale/sample states, and mobile focus/scroll for both dropdown and list selection. Mobile list is disclosed to avoid duplicated navigation. Empty tenant responses never borrow unrelated reports, initial samples are scoped by agency, and request versions prevent a late previous-agency response from replacing the active tenant.

API prefixes normalized because apiFetch already supplies /v1. Existing POST /status and /return remain; plannedDate is now actually submitted and note is editable. Return requires a reason and confirmation. Failures retain form data and never claim success. Both actions are protected against duplicate submission.

Old simulated after-photo toggle previously submitted a hardcoded demo URL and falsely claimed upload. It remains as an explicitly local preview in simulation controls; it cannot satisfy the completion requirement. Actual completion requires an existing AFTER photo or signed Cloudinary upload plus AFTER photo registration through the existing /uploads/cloudinary-sign endpoint. Existing image-compression and exifr dependencies reused; no service packages added. No fabricated GPS fallback: absent EXIF remains null. Actual registered distance warning is nonblocking. Cloudinary unconfigured or registration failures do not create successful proof state. Existing proof is displayed from API URLs. File date default no longer invents a work date.

Reworded technical headings into resident-readable task labels; original report body, dimensions and other facts remain in a disclosure. The old source feature numbers and fake photo filename are not presented as actual evidence. Signed upload requires the existing Cloudinary server configuration. No stock images or missing decorative material slots.

Verification: 40 mocked-API browser checks including Cloudinary signing/upload/registration, completion gating, EXIF handling, date/note payload, return validation/failure/success, correct agency payloads, empty and stale data, offline sample behavior, seven viewport widths, mobile navigation and late-response isolation. No real reports changed or photos uploaded during tests. Finish review: 2 findings resolved. Hallmark comparison at ../compare.html. Production build and final typecheck recorded separately.

Production build passed in isolated copy; final typecheck passed; temporary build copy removed. Final rendered lint: 0 FAIL, 0 WARN, one justified compound-control waiver and one retained-brand dismissal.
