$path = 'C:\Users\cleme\Documents\AI-ClaudeOpus\test.txt'
$content = @'
TUTO SUPABASE — GymCoach AI

=== ETAPE 1 : Creer le projet ===
1. Va sur https://supabase.com et connecte-toi (ou cree un compte)
2. Clique "New project"
3. Nom : gym-coach-ai (ou ce que tu veux)
4. Mot de passe DB : genere-en un fort et garde-le
5. Region : choisis la plus proche (ex: eu-west-1 pour Europe)
6. Clique "Create new project" — attend ~2 min

=== ETAPE 2 : Recuperer les cles ===
1. Dans le dashboard du projet, va dans Settings > API
2. Copie ces 3 valeurs :
   - Project URL           -> c est SUPABASE_URL
   - anon / public key     -> pas utile pour le backend
   - service_role key      -> c est SUPABASE_SERVICE_ROLE_KEY (garde-la secrete)
   - JWT Secret            -> c est SUPABASE_JWT_SECRET (plus bas sur la meme page)

=== ETAPE 3 : Creer le fichier .env ===
A la racine de gym-coach-app, copie .env.example en .env et remplis :

SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
SUPABASE_JWT_SECRET=ton-jwt-secret
PORT=3000
CORS_ORIGIN=*

(Les cles AI on les ajoutera plus tard)

=== ETAPE 4 : Executer les migrations SQL ===
1. Dans le dashboard Supabase, va dans SQL Editor (icone dans la barre gauche)
2. Clique "New query"
3. Ouvre le fichier supabase/migrations/001_initial_schema.sql depuis ton repo
4. Copie-colle tout le contenu dans l editeur
5. Clique "Run" — doit s executer sans erreur
6. Refais la meme chose avec supabase/migrations/002_exercises_schema.sql

=== ETAPE 5 : Verifier les tables ===
1. Va dans Table Editor (icone dans la barre gauche)
2. Tu dois voir : users, user_quotas, exercises
3. Si les 3 tables sont la, c est bon

=== ETAPE 6 : Seeder les exercices ===
Dans un terminal, a la racine du projet :
  npm run seed:exercises
Attendu : "Seeded 20 exercises successfully."
Verifie dans Table Editor > exercises : 20 lignes

=== ETAPE 7 : Tester le backend ===
  npm run dev
Puis dans un autre terminal (ou Postman / curl) :
  curl http://localhost:3000/health
  -> { "status": "ok", "ts": "..." }

  curl http://localhost:3000/health/db
  -> { "status": "ok" }

  curl "http://localhost:3000/exercises?limit=5"
  -> { "data": [...], "total": 20, "page": 1, "limit": 5 }

Si tout ca repond correctement, Supabase est bien configure.
'@
[System.IO.File]::WriteAllText($path, $content, [System.Text.Encoding]::UTF8)
Write-Host "done"
