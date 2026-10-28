from pathlib import Path
p=Path('src/app/admin/moderasi/page.tsx');s=p.read_text(encoding='utf-8');a=s.index('  useEffect(() => {\n    const frame = requestAnimationFrame');b=s.index('  const notify =',a);s=s[:a]+s[b:];p.write_text(s,encoding='utf-8')
p=Path('.hallmark/moderasi/handoff.md');s=p.read_text(encoding='utf-8').replace('selected row brought into view in queue, ','').replace('after selected-row visibility improvement','after mobile navigation improvement');p.write_text(s,encoding='utf-8')
