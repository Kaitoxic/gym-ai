$path = 'C:\Users\cleme\Documents\AI-ClaudeOpus\test.txt'
$content = @'
TESTER L API — GymCoach Backend

=== Prerequis ===
npm run dev doit tourner dans un terminal.
Tu dois voir : [gym-coach-api] listening on port 3000

=== 1. Health (pas besoin de Supabase) ===
curl http://localhost:3000/health
-> { "status": "ok", "ts": "2026-..." }

=== 2. Health DB (necessite Supabase configure dans .env) ===
curl http://localhost:3000/health/db
-> { "status": "ok" }

=== 3. Liste des exercices (necessite Supabase + seed fait) ===
curl http://localhost:3000/exercises
-> { "data": [...20 exercices...], "total": 20, "page": 1, "limit": 20 }

Avec filtre :
curl "http://localhost:3000/exercises?muscle_group=chest"
curl "http://localhost:3000/exercises?difficulty=beginner"
curl "http://localhost:3000/exercises?search=squat"

=== 4. Exercice par slug ===
curl http://localhost:3000/exercises/barbell-squat
-> { "data": { "slug": "barbell-squat", ... } }

curl http://localhost:3000/exercises/slug-qui-nexiste-pas
-> 404 { "error": "Exercise not found" }

=== 5. POST /ai/proxy (necessite JWT Supabase valide) ===
Pour l instant skip -- pas de frontend donc pas de JWT facilement.
On le testera quand l auth mobile sera en place (Phase 2).

=== Outil recommande ===
Si tu veux pas utiliser curl, installe l extension VS Code "REST Client"
ou utilise Postman / Insomnia. Plus pratique pour voir les reponses JSON.
'@
[System.IO.File]::WriteAllText($path, $content, [System.Text.Encoding]::UTF8)
Write-Host "done"
