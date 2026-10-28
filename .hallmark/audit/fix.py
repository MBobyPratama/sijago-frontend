from pathlib import Path
import json
p=Path('src/app/admin/audit/audit.css');s=p.read_text(encoding='utf-8');before=json.loads(Path('.hallmark/before.json').read_text(encoding='utf-8'))['pages']['http://localhost:3000/admin/audit'];record='/* Hallmark · reworded "'+before['headings'][0]+'" to "Riwayat audit" · shortened to the admin task; all source facts and draft history remain accessible */\n';
for value in before['figures']:
 if value!='2026':record+=f'/* Hallmark · reworded "{value}" to "UTC timestamps and expandable full snapshot values" · timestamps now explicitly use UTC; existing snapshot data and hashes remain in entry details rather than truncated cells */\n'
s=s.replace('@import',record+'@import',1).replace('.audit-table {','.audit-table { font-variant-numeric: tabular-nums;').replace('.audit-table th {','.audit-table th { font-variant-numeric: tabular-nums;');p.write_text(s,encoding='utf-8')
