from pathlib import Path
p=Path('.hallmark/verify-detail.mjs');s=p.read_text().replace("await page.keyboard.press('Shift+Tab');", "await page.keyboard.down('Shift');await page.keyboard.press('Tab');await page.keyboard.up('Shift');");p.write_text(s)
