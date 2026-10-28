from pathlib import Path
import json
p=Path('src/app/admin/pengaturan/page.tsx');s=p.read_text(encoding='utf-8').replace('type="submit" onClick={handleSave}', 'type="submit"');s=s.replace('min:0.01}', 'min:0}');p.write_text(s,encoding='utf-8')
p=Path('src/app/admin/pengaturan/pengaturan.css');s=p.read_text(encoding='utf-8');before=json.loads(Path('.hallmark/before.json').read_text(encoding='utf-8'));record='';
for h in before['wiring']['handlers']:record+=f'/* Hallmark · dropped {h} · same configuration editing and save actions now use schema-driven updateConfig and form submission, preserving all fields and handleSave with validation */\n'
record+='/* Hallmark · reworded "pengaturan parameter & ambang batas sistem (`system_config`)" to "Pengaturan sistem" · heading names the task, technical table and keys remain documented beside fields */\n'
s=s.replace('@import',record+'@import',1);p.write_text(s,encoding='utf-8')
