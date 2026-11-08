# PDT Cookbook

A private, invite-only recipe cookbook. Members sign in with Google, are approved by an
admin, and can then browse recipes, comment, like, level up, and suggest new recipes for
admin approval.

## Tech stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS
- **Prisma 6** + **PostgreSQL** (Neon recommended for production)
- **Auth.js (NextAuth) v5** with Google OAuth
- **Vercel Blob** for recipe photo uploads

## Local development

### 1. Install dependencies

```bash
npm install
```

### 2. Database

You need a local Postgres instance. If you have `postgresql` installed:

```bash
sudo pg_ctlcluster 16 main start   # or however Postgres is managed on your system
createdb pdt_cookbook
```

Or use Docker:

```bash
docker run -d --name pdt-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=pdt_cookbook -p 5432:5432 postgres:16
```

### 3. Environment variables

Copy `.env.example` to `.env` and fill in the values (see [Environment variables](#environment-variables) below).

```bash
cp .env.example .env
```

For local dev, `DATABASE_URL` and `DIRECT_URL` can both point at your local Postgres:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/pdt_cookbook?schema=public"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/pdt_cookbook?schema=public"
```

Generate `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

### 4. Google OAuth client (required even for local dev)

1. Go to the [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Create an **OAuth 2.0 Client ID** of type **Web application**.
3. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (local dev)
   - `https://<your-production-domain>/api/auth/callback/google` (once deployed)
4. Copy the Client ID/Secret into `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` in `.env`.
5. Set `ADMIN_EMAIL` in `.env` to the Google account you want auto-approved as admin
   the first time it signs in.

### 5. Run migrations and seed sample data

```bash
npx prisma migrate dev
npx prisma db seed   # optional: adds a handful of sample recipes
```

### 6. Vercel Blob (photo uploads)

Photo upload only works with a real `BLOB_READ_WRITE_TOKEN`. You can leave it blank
for local dev if you don't need to test photo uploads — everything else works without it.
To enable it: create a Blob store in the [Vercel dashboard](https://vercel.com/dashboard)
under Storage, and copy the token into `.env`.

### 7. Run the dev server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000). Sign in with the Google account
you set as `ADMIN_EMAIL` to land as an approved admin; any other Google account will be
created as `PENDING` and needs to be approved from `/admin/users`.

## Environment variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | Pooled Postgres connection string (used at runtime) |
| `DIRECT_URL` | Direct (unpooled) Postgres connection string (used for migrations) |
| `AUTH_SECRET` | Random secret for signing sessions — `openssl rand -base64 32` |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google OAuth client credentials |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob store token, for recipe photo uploads |
| `ADMIN_EMAIL` | The Google account auto-approved as admin on first sign-in |

## Deploying to production (Vercel + Neon)

1. **Database**: create a project at [neon.tech](https://neon.tech) (or via Vercel's
   Neon integration under Storage). Copy the pooled connection string into
   `DATABASE_URL` and the direct connection string into `DIRECT_URL`.
2. **Vercel project**: import this repo into [Vercel](https://vercel.com/new).
3. **Environment variables**: set all the variables from the table above in the
   Vercel project settings (Production, and Preview if you want preview deploys to work).
4. **Google OAuth**: add your production domain's callback URL
   (`https://your-domain/api/auth/callback/google`) to the OAuth client's authorized
   redirect URIs in the Google Cloud Console.
5. **Vercel Blob**: create a Blob store under the project's Storage tab; the
   `BLOB_READ_WRITE_TOKEN` env var is added automatically when you connect it.
6. **Migrate**: run `npx prisma migrate deploy` against the production database
   (Vercel can run this as part of the build command, e.g.
   `prisma migrate deploy && next build`).
7. Deploy, then do a full walkthrough as the admin: approve a test account, publish a
   recipe, submit a recipe as a member, approve it, and confirm comments/likes work.

## Project structure

- `app/(app)/` — the gated member-facing shell (sidebar, recipes, profile)
- `app/admin/` — staff dashboard. Admins get everything (member approval and roles, recipe CRUD, submission queue, comments). Moderators get the overview, the recipe submission queue, and comment moderation only.
- `app/login`, `app/pending` — public sign-in and awaiting-approval pages
- `proxy.ts` — route gating (redirects unauthenticated/unapproved requests; limits `/admin` by role)
- `auth.ts` — Auth.js configuration (Google provider, approval bootstrap logic)
- `prisma/schema.prisma` — data model
- `lib/` — Prisma client, auth helpers, validation schemas, family-tree logic
- `components/` — UI primitives and feature components (sidebar, recipes, comments,
  likes, levels, family tree, admin tables)

## XP, levels and badges

Members earn XP, shown as a level next to their name. XP is an append-only ledger
(`XpEvent`) with a cached total on `User.xp`; levels and ranks are derived from it
(`lib/levels.ts`), so tuning the curve needs no migration. Point values and the
comment anti-spam rules live in `lib/xp-rules.ts`; badge rules in `lib/badges.ts`.

| Action | XP |
| --- | --- |
| Daily visit (once per day, Eastern time) | 5 |
| Recipe approved into the cookbook | 30 |
| Like received (once per member per recipe, not your own) | 3 |
| Recipe liked (once per recipe, not your own) | 1 |
| Substantive comment on someone else's recipe (first per recipe, max 3 per 24h) | 3 |

Level 2 is 10 XP; levels 1–10 are Dishwasher, then Prep cook, Line cook, Sous chef
and Head chef every ten levels (max 50). Moderators deleting a comment also removes
the XP it earned (replies are deleted with their parent comment).

## Previewing as another role

Admins get a **View as: Member / Moderator** control in the header. It sets a
cookie (`pdt_view_as`, 8 hours) and the whole site then behaves as that role:
navigation, `/admin` access and server-action permissions all follow the
*effective* role (`getViewState` in `lib/authz.ts`, `lib/viewAs.ts`). A banner
with **Exit preview** stays on screen meanwhile. The cookie can only lower a real
admin's role; it is ignored for everyone else. Anything you post while previewing
is still posted as your own account.

## Roles

| Role | Can do |
| --- | --- |
| Member | Browse, comment, like, suggest recipes (after admin approval of their account) |
| Moderator | Everything a member can, plus approve/reject recipe submissions and delete any comment (`/admin`, `/admin/recipes/pending`, `/admin/comments`) |
| Admin | Everything, plus approve members, change roles, and create/edit/delete recipes |

Admins assign the Moderator role from `/admin/users` → Edit. Role changes can take up to an hour to appear for a
signed-in user (the role is cached in their session) unless they sign out and back in.
