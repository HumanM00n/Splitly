# Quits

Petite app de partage de dépenses entre amis (type Tricount simplifié), qui sert de support pour apprendre la CI/CD.

- Groupes et membres, dépenses réparties équitablement (montants en centimes)
- Soldes de chaque membre et liste minimale des remboursements (« Chloé doit 45,00 € à Alice »)

Stack : Next.js 16 (App Router, Server Actions) · TypeScript · Prisma 7 + PostgreSQL · Zod · Tailwind CSS · Vitest · Playwright.

## Prérequis

- Node.js 24
- Docker (pour PostgreSQL), ou un serveur PostgreSQL existant

## Lancer le projet en local

```bash
# 1. Dépendances (génère aussi le client Prisma)
npm install

# 2. PostgreSQL : crée les bases splitly (dev) et splitly_test (tests)
docker compose up -d

# 3. Variables d'environnement
cp .env.example .env
cp .env.test.example .env.test

# 4. Schéma et données de démo
npm run db:migrate
npm run db:seed

# 5. Serveur de dev sur http://localhost:3000
npm run dev
```

Si la base existait avant l'ajout de `docker/init-test.sql`, la base `splitly_test` n'est pas créée : lancer `docker compose down -v` puis `docker compose up -d` (cela efface les données locales).

## Tests

| Commande                   | Contenu                                                                                   |
| -------------------------- | ----------------------------------------------------------------------------------------- |
| `npm test`                 | Tests unitaires du domaine (`src/lib/domain/`)                                            |
| `npm run test:coverage`    | Idem, avec couverture ; échoue sous 100 %                                                 |
| `npm run test:integration` | Services + vraie base Postgres (`DATABASE_URL` de `.env.test`)                            |
| `npm run test:e2e`         | Parcours complet dans Chromium (build + `next start` sur le port 3100, même base de test) |

Avant le premier `test:e2e` : `npx playwright install chromium`.

Les tests d'intégration et E2E **vident la base** : ils refusent de tourner si le nom de la base ne contient pas `test`. Ils appliquent eux-mêmes les migrations. En CI, il suffit de définir `DATABASE_URL` : une variable déjà définie n'est jamais écrasée par `.env.test`.

## Scripts

Tous non interactifs, pour la CI :

| Script                                 | Rôle                                               |
| -------------------------------------- | -------------------------------------------------- |
| `dev`, `build`, `start`                | Next.js                                            |
| `lint`, `typecheck`, `format:check`    | ESLint, `next typegen && tsc --noEmit`, Prettier   |
| `format`                               | Formate tout le projet                             |
| `test`, `test:integration`, `test:e2e` | Voir ci-dessus                                     |
| `db:migrate`                           | `prisma migrate deploy`                            |
| `db:migrate:dev`                       | Crée une migration après modification du schéma    |
| `db:seed`                              | Crée le groupe de démo (idempotent)                |
| `db:generate`                          | Régénère le client Prisma (lancé au `postinstall`) |

## Architecture

```
src/
  app/                 Pages (Server Components) et Server Actions (actions.ts)
  components/          Formulaires (Client Components) et petits composants d'UI
  lib/
    domain/            Logique métier pure : parts, soldes, remboursements, montants
    validation.ts      Schémas Zod
    services/          Validation Zod → domaine → DB (appelés par les Server Actions)
    db/                Accès Prisma
  generated/prisma/    Client Prisma généré (non versionné)
prisma/                Schéma, migrations, seed
tests/
  integration/         Vitest + Postgres
  e2e/                 Playwright
```

Règles notables :

- Les montants sont des entiers en centimes. Les centimes restants d'une division vont aux premiers participants dans l'ordre d'ajout au groupe (10,00 € / 3 → 3,34 / 3,33 / 3,33).
- Un membre qui a payé ou participé à une dépense ne peut pas être retiré.
- Remboursements : algorithme glouton, du plus gros débiteur vers le plus gros créancier.
