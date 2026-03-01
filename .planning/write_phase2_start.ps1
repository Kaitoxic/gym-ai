$path = 'C:\Users\cleme\Documents\AI-ClaudeOpus\test.txt'
$content = @'
On passe a Phase 2 : Authentication (Mobile Client).

Avant de coder, une decision de structure a prendre :
Le repo gym-coach-app contient deja le backend Express a la racine (src/, package.json, etc.)
L app Expo a besoin aussi d un src/ et d un package.json a la racine.

Je vais reorganiser en monorepo :
  gym-coach-app/
  ├── api/        <- backend Express (ce qu on a deja, juste deplace)
  └── mobile/     <- app Expo React Native (a creer)

Ca gardera tout propre. Je commence :
1. Deplace les fichiers backend dans api/
2. Cree l app Expo dans mobile/
3. Commence la Phase 2 (Supabase Auth SDK + authStore + login/register screens)

C est parti.
'@
[System.IO.File]::WriteAllText($path, $content, [System.Text.Encoding]::UTF8)
Write-Host "done"
