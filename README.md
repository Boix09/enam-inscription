# ENAM - Fiche de renseignements élèves

Site de collecte d'informations pour les élèves de la promotion **Techniques Réseaux Informatique 2024-2027** de l'ENAM (École Nationale des Arts et Métiers, Haïti).

## Stack technique

- **Base de données** : Supabase (Postgres + RLS)
- **Backend** : Node.js + Express
- **Frontend** : HTML/CSS/JS vanilla (mobile-first)
- **Exports** : `docx` (Word), `exceljs` (Excel)
- **Hébergement** : Vercel + Supabase (gratuit)

## Structure du projet

```
enamdt/
├── public/              # Frontend statique
│   ├── index.html       # Formulaire élève
│   ├── admin.html       # Page admin
│   ├── style.css        # Styles
│   ├── script.js        # JS formulaire élève
│   └── admin.js         # JS page admin
├── src/                 # Backend
│   ├── server.js        # Serveur Express
│   ├── db.js            # Client Supabase
│   ├── routes/
│   │   ├── students.js  # API CRUD étudiants
│   │   └── exports.js   # API exports Word/Excel
│   └── utils/
│       ├── docxGenerator.js
│       └── excelGenerator.js
├── supabase/
│   └── schema.sql       # Schéma de la base + RLS
├── .env.example         # Variables d'environnement (template)
├── .gitignore
├── package.json
├── vercel.json
└── README.md
```

## Configuration Supabase

1. Crée un compte gratuit sur [supabase.com](https://supabase.com)
2. Crée un nouveau projet
3. Dans l'éditeur SQL (SQL Editor), colle et exécute le contenu de `supabase/schema.sql`
4. Dans **Project Settings > API**, récupère :
   - **Project URL** → `SUPABASE_URL`
   - **anon public key** → `SUPABASE_ANON_KEY`
   - **service_role key** (ne jamais exposer côté client) → `SUPABASE_SERVICE_ROLE_KEY`

## Variables d'environnement

Crée un fichier `.env` à la racine :

```
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_ANON_KEY=votre-cle-anon-publique
SUPABASE_SERVICE_ROLE_KEY=votre-cle-service-role-secrete
ADMIN_PASSWORD=votre-mot-de-passe-admin
```

> **Ne jamais commit le `.env`** (il est dans `.gitignore`).

## Installation et lancement en local

```bash
npm install
npm run dev     # ou : node --watch src/server.js
```

Le site sera accessible sur `http://localhost:3000`.

## Pages

| URL | Description |
|---|---|
| `/` ou `/index.html` | Formulaire élève (public) |
| `/admin` | Page admin (protégée par mot de passe) |

### API

| Méthode | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/students` | anon (public) | Soumettre une fiche |
| GET | `/api/students` | `Authorization: <password>` | Liste des élèves |
| GET | `/api/exports/word` | `Authorization: <password>` | Télécharger Word |
| GET | `/api/exports/excel` | `Authorization: <password>` | Télécharger Excel |

## Déploiement sur Vercel

1. **Pousse le code sur GitHub** :
   ```bash
   git init && git add . && git commit -m "Initial commit"
   # Crée un dépôt sur GitHub, puis :
   git remote add origin https://github.com/toncompte/enam-inscription.git
   git push -u origin main
   ```

2. **Connecte Vercel à GitHub** :
   - Va sur [vercel.com](https://vercel.com)
   - **Add New > Project**
   - Importe le dépôt `enam-inscription`
   - Vercel détecte automatiquement `vercel.json`

3. **Ajoute les variables d'environnement** dans Vercel :
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_PASSWORD`

4. **Déploie** → Vercel te donnera une URL du type `enam-inscription.vercel.app`

### Option : domaine personnalisé

Si tu veux utiliser `enam.letserver.dpdns.org` :

1. Dans Vercel : **Project Settings > Domains** → ajoute `enam.letserver.dpdns.org`
2. Sur Cloudflare, ajoute un enregistrement **CNAME** :
   - **Nom** : `enam`
   - **Cible** : `cname.vercel-dns.com`
   - **Proxy** : DNS only (désactive le proxy orange)
3. Vercel vérifie automatiquement le domaine (quelques minutes)

## Sécurité

- La clé `SUPABASE_SERVICE_ROLE_KEY` n'est **jamais** envoyée au navigateur
- Le mot de passe admin est transmis en en-tête `Authorization` (HTTPS)
- RLS activée : les élèves peuvent uniquement insérer, pas lire les autres fiches
