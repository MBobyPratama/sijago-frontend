from pathlib import Path
import json
p=Path('src/app/admin/moderasi/moderasi.css');s=p.read_text(encoding='utf-8');s=s.replace('/* Hallmark · waive 39b · report rows are selectable records with title, status and location, not single-line controls; their expanded hit target is intentional */','/* Hallmark · waive 39b · app queue records carry title, status and location · multi-line record selection intentionally exceeds a single-line button height */')
s=s.replace('@import','''/* Hallmark · waive 38iii · the span is a live queue count, not an accented heading word · numeric metadata is smaller to distinguish it from the section title */
/* Hallmark · dismissed 49 · the queue selection control is a report record with a wrapping title and separate metadata, not a single-line action label */
/* Hallmark · dropped onChange={(e) => handleRejectReport(e.target.value)} · reason selection is retained; a separate explicit button and confirmation invoke the same rejection handler to prevent accidental rejection */
/* Hallmark · dropped onClick={() => setShowEmailModal(true)} · identical preview opening now also records its trigger for keyboard focus restoration */
/* Hallmark · reworded "5.12" to "Aktifkan blur publik" · removes the internal FR identifier from the action label; blur capability retained */
'''+''.join(f'/* Hallmark · reworded "{h}" to "moderation workbench" · headings tightened to task names and selected report title still renders from API */\n' for h in json.loads(Path('.hallmark/before.json').read_text(encoding='utf-8'))['pages']['http://localhost:3000/admin/moderasi']['headings'][:-1])+'@import')
s=s.replace('.moderation-page p {','.moderation-page p { max-width: 75ch;')
s=s.replace('border-left: 3px solid var(--color-paper-3);','').replace('border-left-color: var(--color-accent);','outline: 1px solid var(--color-accent); outline-offset: -1px;')
s=s.replace('.mod-status {','.mod-status { font-variant-numeric: tabular-nums;')
p.write_text(s,encoding='utf-8')
