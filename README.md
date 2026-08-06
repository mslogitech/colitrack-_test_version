# COLITRACK — Plateforme de gestion logistique interurbaine

Projet complet développé pour digitaliser l'envoi et le suivi de colis via bus au Cameroun.

## Structure du projet

```
colitrack/
├── backend/          API Node.js + Express (testée et fonctionnelle)
├── agent-app/        PWA pour les agents guichet/quai (testée et fonctionnelle)
└── mobile-app/       App mobile Expo/React Native pour les clients (code livré, non testée)
```

## État d'avancement

| Composant | État | Détail |
|---|---|---|
| Backend API | ✅ Fonctionnel, testé de bout en bout | Tous les endpoints du cahier des charges, flux complet vérifié avec de vraies requêtes |
| PWA Agent | ✅ Fonctionnelle, build validé | Interface guichet + quai, scanner QR caméra, testée avec le backend réel |
| App Mobile | ⚠️ Code complet livré, non testée | Nécessite Expo Go / un émulateur pour être testée — indisponible dans mon environnement |

---

## 1. Backend — démarrage

```bash
cd backend
npm install
node seed-agents.js   # crée les 2 comptes de test (guichet + quai) - à faire une seule fois
node seed-buses.js    # crée 35 bus de test avec trajets variés - à faire une seule fois
npm start          # ou: node server.js
```

L'API démarre sur `http://localhost:3000`. Base de données : fichier JSON local (`db/colitrack.json`) via `lowdb`, pour le prototypage rapide sans dépendances natives.

**Avant la mise en production**, migrer vers PostgreSQL comme prévu dans le cahier des charges :
- Remplacer `db/database.js` par une connexion PostgreSQL (ex: avec `pg` ou `Prisma`)
- Le schéma des tables (`agents`, `pre_enrolements`, `colis`, `bus`, `manifestes`, `historique_scans`) est déjà défini par la structure des objets utilisés — à transposer en tables SQL

### Comptes de test créés pendant les tests
| Rôle | Email | Mot de passe |
|---|---|---|
| Guichet | guichet@colitrack.cm | test123 |
| Quai | quai@colitrack.cm | test123 |

Pour créer d'autres agents : `POST /api/register`

### Endpoints principaux
Tous ceux du cahier des charges sont implémentés : `/api/pre-enrolement`, `/api/valider-colis`, `/api/scan/chargement`, `/api/cloture-manifeste`, `/api/scan/arrivee`, `/api/livraison`, `/api/login`, plus quelques utilitaires (`/api/bus`, `/api/colis`, `/api/historique/:colisId`).

---

## 2. PWA Agent — démarrage

```bash
cd agent-app
npm install
npm run dev         # développement, http://localhost:5173
npm run build        # build de production dans dist/
```

Modifier `agent-app/.env` pour pointer vers l'URL du backend en production :
```
VITE_API_URL=https://votre-api.railway.app/api
```

Design : identité visuelle sombre violet-nuit / ambre, cohérente avec le positionnement premium de vos autres projets (SPOTTLY). Scanner QR via caméra avec repli en saisie manuelle si la caméra est indisponible.

---

## 3. App Mobile — démarrage (nécessite un poste avec Expo)

```bash
cd mobile-app
npm install
npx expo start
```

Scanner le QR avec l'app **Expo Go** (Android/iOS) pour tester sur un vrai téléphone, ou lancer un émulateur.

Fonctionnalités livrées :
- Formulaire de pré-enrôlement avec sélection de ville
- Génération et affichage du QR temporaire (`react-native-qrcode-svg`)
- Écran de suivi de colis en temps réel avec timeline visuelle
- **Mode hors-ligne** : les pré-enrôlements créés sans réseau sont mis en file d'attente et synchronisés automatiquement au retour de la connexion

À faire avant mise en production :
- Intégrer Firebase Cloud Messaging pour les notifications push (prévu au cahier des charges, non implémenté — nécessite un compte Firebase et des clés de configuration propres à votre projet)
- Remplacer `API_BASE` dans `mobile-app/api/client.js` par l'URL de production
- Générer un APK/build de production via `eas build`

---

## 4. Déploiement recommandé

| Composant | Hébergeur suggéré |
|---|---|
| Backend | Railway ou DigitalOcean App Platform |
| PWA Agent | Vercel ou Netlify |
| Mobile | Expo Application Services (EAS Build) → APK Android |

## 5. Sécurité — déjà en place
- JWT avec expiration 12h
- Mots de passe hashés (bcrypt)
- QR anti-rejeu (UUID + timestamp)
- Aucune donnée sensible dans le QR
- Audit trail horodaté sur chaque scan (`historique_scans`)

À ajouter en production : HTTPS/TLS (géré automatiquement par Railway/Vercel), variable `JWT_SECRET` forte et secrète (actuellement une valeur de dev dans `.env`).

## 6. Prochaines étapes suggérées
1. Migrer le backend vers PostgreSQL
2. Tester l'app mobile avec Expo Go sur un vrai téléphone
3. Intégrer les notifications push (FCM)
4. Déployer le backend et la PWA, faire un pilote avec une agence réelle (3-10 bus, comme ciblé)
