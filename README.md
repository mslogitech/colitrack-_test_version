# COLITRACK — Gestion administrative (Phase 1 : Agence)

Suivi de colis pour ... Voyage. Ce dépôt contient deux dossiers indépendants :

```
colitrack/
  backend/    API Express + Supabase (Postgres + Auth)
  frontend/   Dashboard agence (HTML/CSS/JS, sans framework)
```

## Statut des modules

| Module          | État                                                              |
|------------------|--------------------------------------------------------------------|
| Authentification | ✅ Réel — Supabase Auth, rôles `chef` / `guichet` / `quai`         |
| Colis (créer/lister/scanner) | ✅ Réel — branché sur l'API                          |
| Tableau de bord  | ✅ Réel — KPI calculés à partir des colis existants                |
| Finance          | 🟡 Partiel — revenu du mois / encaissé du jour réels ; graphiques et clôtures de caisse encore illustratifs (marqués `*exemple`) |
| Statistiques     | 🟠 Illustratif — graphiques avec données d'exemple                |
| Flotte / Manifestes / Agences | 🟠 Illustratif — en attente d'un schéma dédié (phase 2) |

Les vues marquées 🟠 fonctionnent visuellement mais n'écrivent/ne lisent pas encore la base de données. Elles sont clairement commentées `// NOTE : données d'exemple` dans leur fichier JS respectif.

## 1. Mise en place de Supabase

1. Crée un projet sur [supabase.com](https://supabase.com).
2. Va dans **SQL Editor** et exécute le contenu de `backend/sql/schema.sql`.
3. Va dans **Authentication > Users** et crée un premier utilisateur (ton compte administrateur), ou utilise l'API `POST /api/agents` une fois le backend démarré avec un premier compte `chef` créé manuellement.
4. Dans **Project Settings > API**, récupère :
   - `Project URL` → `SUPABASE_URL`
   - clé `anon` `public` → `SUPABASE_ANON_KEY`
   - clé `service_role` (⚠️ secrète) → `SUPABASE_SERVICE_ROLE_KEY`

### Créer le tout premier compte admin (chef d'agence)

Comme `POST /api/agents` exige déjà d'être connecté en `chef`, le tout premier compte doit être créé manuellement :

1. Dans Supabase, **Authentication > Users > Add user**, crée le compte (email + mot de passe), avec "Auto Confirm User" coché.
2. Dans **SQL Editor**, insère son profil :
   ```sql
   insert into public.agents (id, nom_complet, ville_agence, role)
   values ('b1d17544-2d2e-42e1-b5bd-a00fac1fd482', 'Florien', 'Yaoundé Centre', 'chef');
   ```
   (L'UUID est visible dans la liste des utilisateurs Auth.)

## 2. Backend — test en local

```bash
cd backend
cp .env.example .env
# remplis SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY dans .env
npm install
npm run dev
```

Le serveur démarre sur `http://localhost:3001` et sert **aussi** le frontend (dossier `../frontend`) — pratique pour tester tout en un.

Vérification rapide :
```bash
curl http://localhost:3001/
# {"status":"ok","service":"colitrack-api",...}
```

## 3. Frontend — configuration locale

```bash
cd frontend
cp js/config.example.js js/config.js
# remplis supabaseUrl, supabaseAnonKey (clé anon, PAS service_role) et apiBase
```

Ouvre ensuite `http://localhost:3001/index.html` dans ton navigateur (servi par le backend), connecte-toi avec le compte admin créé à l'étape 1.

> `frontend/js/config.js` est dans `.gitignore` — chaque environnement (local / prod) a le sien.

## 4. Déploiement sur Contabo

### Option Docker (recommandée)

```bash
cd backend
docker compose up -d --build
```

Le conteneur écoute sur le port `3001`. Place ensuite un reverse proxy Nginx devant :

```nginx
server {
    listen 80;
    server_name api.tondomaine.com;
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Puis active le HTTPS avec `certbot --nginx -d api.tondomaine.com`.

### Variables d'environnement en production

Ne commite jamais `.env`. Sur le VPS, crée-le directement (`nano backend/.env`) avec les vraies clés Supabase, et `frontend/js/config.js` avec l'URL publique de ton API (`apiBase: "https://api.tondomaine.com"`).

## 5. Prochaines étapes (phase 2)

- Brancher réellement le module **Finance** (table `encaissements` déjà créée dans le schéma — il reste à appeler `POST /api/finance/encaissements` au moment de l'enregistrement d'un colis, et à construire les agrégats journaliers pour les graphiques).
- Créer les tables `bus`, `manifestes`, `agences_reseau` pour rendre Flotte / Manifestes / Agences réels.
- Partie **Client** (suivi public d'un colis sans authentification, avec scan QR côté client) — c'était la phase 2 déjà évoquée au tout début du projet.
