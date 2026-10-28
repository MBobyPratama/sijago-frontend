from pathlib import Path
p=Path('src/app/admin/pengaturan/page.tsx');s=p.read_text(encoding='utf-8');needle='    window.addEventListener("beforeunload",warn);return()=>window.removeEventListener("beforeunload",warn);';s=s.replace(needle,'''    const guardNavigation=(event:MouseEvent)=>{
      if (event.defaultPrevented || event.button!==0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const link=(event.target as Element)?.closest<HTMLAnchorElement>("a[href]");
      if (!link || link.target==="_blank" || link.hasAttribute("download")) return;
      const target=new URL(link.href,window.location.href);
      if (target.origin!==window.location.origin || (target.pathname===window.location.pathname && target.search===window.location.search)) return;
      if (!window.confirm("Perubahan belum disimpan. Tinggalkan halaman dan buang perubahan?")) { event.preventDefault();event.stopImmediatePropagation(); }
    };
    window.addEventListener("beforeunload",warn);
    document.addEventListener("click",guardNavigation,true);
    return()=>{window.removeEventListener("beforeunload",warn);document.removeEventListener("click",guardNavigation,true);};''');p.write_text(s,encoding='utf-8')
p=Path('src/app/admin/pengaturan/pengaturan.css');s=p.read_text(encoding='utf-8');s=s.replace('.settings-section { scroll-margin-top: var(--space-lg); padding-block: var(--space-xl);', '.settings-section { scroll-margin-top: var(--space-lg); padding-block: var(--space-lg);');s=s.replace('.settings-section-heading { margin-bottom: var(--space-lg); }', '.settings-section-heading { margin-bottom: var(--space-md); }');s=s.replace('.settings-save-bar {', '.settings-save-bar { position: sticky; bottom: 0; z-index: 10; background: var(--color-paper); border-top: 1px solid var(--color-rule);');s=s.replace('/* Hallmark · pre-emit', '/* Hallmark · finish-review: subagent · 2 findings · guarded internal navigation and reduced spacing with persistent save controls */\n/* Hallmark · pre-emit',1);p.write_text(s,encoding='utf-8')
