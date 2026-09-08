# Shaded banner scripts

Tier A legible banners via figlet. Tier B via blocklet or Node port.

```bash
node scripts/shaded-banner/generate-tier-a.mjs "ANDRE" --font "ANSI Shadow"
node scripts/shaded-banner/validate-banner.mjs path/to/banner.txt --expected "ANDRE SCHU"
```

Tier B candidates (PowerShell; prefers `cargo install blocklet`, falls back to Node port):

```powershell
.\T3MP3ST_BLU3H4T\scripts\shaded-banner\generate-tier-b-candidates.ps1
```

Skill: [MiscRepos `.cursor/skills/shaded-unicode-banner`](../../../.cursor/skills/shaded-unicode-banner/SKILL.md)
