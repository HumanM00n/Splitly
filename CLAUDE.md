# Quits — App de dépenses partagées

## Contexte

Petite app web de partage de dépenses entre amis (type Tricount simplifié).
Objectif principal du projet : **servir de support pour apprendre la CI/CD**.
Le code doit donc rester simple, bien testé et facile à automatiser.
La CI/CD (GitHub Actions, déploiement) est gérée à part : **ne pas créer de workflow ni de config de déploiement**.

## Stack

- Next.js (App Router) + TypeScript (strict)
- Prisma + PostgreSQL
- Server Actions pour les mutations, Server Components pour la lecture
- Validation avec Zod
- Tailwind CSS pour l'UI (sobre, pas de lib de composants lourde)
- Vitest pour les tests unitaires et d'intégration
- Playwright pour les tests end-to-end
- ESLint + Prettier

## Fonctionnalités métier

### 1. Groupes et membres

- Créer un groupe (nom obligatoire, 1 à 50 caractères)
- Ajouter / retirer des membres (nom unique dans le groupe)
- Lister les groupes et voir le détail d'un groupe
- Un membre impliqué dans une dépense ne peut pas être supprimé

### 2. Dépenses

- Ajouter une dépense : libellé, montant, payeur, participants, date
- Répartition équitable entre les participants sélectionnés
- Modifier / supprimer une dépense
- Lister les dépenses d'un groupe (les plus récentes en premier)
- Règles :
  - Montant > 0, stocké **en centimes (Int)**, jamais en float
  - Au moins 1 participant
  - Le payeur et les participants appartiennent au groupe
  - Les centimes restants d'une division non entière sont répartis de façon déterministe (ex. 10,00 € / 3 → 3,34 / 3,33 / 3,33)

### 3. Équilibres et remboursements

- Calculer le solde de chaque membre (payé − dû)
- Calculer la liste des remboursements à faire pour que tout le monde soit quitte, en minimisant le nombre de transactions (algo glouton : plus gros débiteur → plus gros créancier)
- Afficher « Machin doit X € à Truc »
- La somme des soldes doit toujours valoir 0

## Modèle de données (indicatif)

- `Group` : id, name, createdAt
- `Member` : id, name, groupId
- `Expense` : id, label, amountCents, date, groupId, payerId
- `ExpenseParticipant` : expenseId, memberId, shareCents

## Architecture

- La logique métier (calcul des parts, soldes, remboursements) est dans `src/lib/domain/`, en **fonctions pures sans dépendance à Prisma ni Next**
- L'accès DB est dans `src/lib/db/`
- Les Server Actions appellent la validation Zod → le domaine → la DB
- La config passe uniquement par des variables d'environnement (`DATABASE_URL`), avec un `.env.example` à jour

## Tests attendus

- **Unitaires** (Vitest) : couverture complète de `src/lib/domain/` — répartition des centimes, soldes, remboursements, cas limites (1 seul membre, tout le monde à 0, montants non divisibles)
- **Intégration** (Vitest + vraie base Postgres de test via `DATABASE_URL`) : création de groupe, ajout de dépense, contraintes métier
- **E2E** (Playwright) : 1 parcours complet → créer un groupe, ajouter 3 membres, 2 dépenses, vérifier les remboursements affichés

## Scripts npm (doivent tous tourner sans interaction, pour la CI)

- `dev`, `build`, `start`
- `lint`, `typecheck` (`tsc --noEmit`), `format:check`
- `test` (unitaires), `test:integration`, `test:e2e`
- `db:migrate` (`prisma migrate deploy`), `db:seed`

## Hors scope

- Authentification (pas de comptes utilisateurs)
- Multi-devises
- Répartition non équitable (pourcentages, parts)
- Workflows CI/CD et config d'hébergement

## Ordre de travail suggéré

1. Init du projet (Next.js, Prisma, Vitest, ESLint/Prettier, scripts)
2. Domaine pur + tests unitaires
3. Schéma Prisma + migrations + seed
4. Feature 1 → 2 → 3, avec tests d'intégration au fur et à mesure
5. UI minimale
6. Test E2E Playwright
7. README : lancer le projet en local et les tests

Faire des commits petits et clairs (Conventional Commits : `feat:`, `fix:`, `test:`, `chore:`).
