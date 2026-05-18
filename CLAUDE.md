# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project: Fafi

Fafi is a web app for friends who get together to play FIFA. It handles a single day's session:
- Someone creates a session and marks who's present
- Teams are formed manually or via AI draw (2v2 or 1v1)
- Casual matches or tournaments (league / single-elimination bracket) are played
- With 6 players in 2v2 mode, rotation is automatic (the losing/resting team swaps out)
- All results and stats are tracked historically

**Key constraints:**
- All users have equal permissions; there is no admin role
- Only one session can be `active` at a time
- Teams and tournaments are scoped to a session
- Google OAuth is the only auth provider
- The app UI is in Spanish (domain terms: sesión, equipos, partidos, torneo)

## Stack

- **TanStack Start** — SSR framework (React 19, Vite, Nitro) with file-based routing via TanStack Router
- **Convex** — backend-as-a-service: database, server functions, and real-time subscriptions
- **Better Auth** — authentication library with Convex adapter; Google OAuth only
- **shadcn/ui** — component library (style: `radix-nova`, base color: `mist`)
- **Tailwind CSS v4** — styling via `@tailwindcss/vite`
- **Gemini API** — AI-powered team suggestions and fixture generation

## Commands

```bash
pnpm dev          # Start dev server on port 3000
pnpm build        # Production build
pnpm preview      # Preview production build
pnpm test         # Run tests (vitest)
pnpm lint         # ESLint
pnpm format       # Prettier (all .ts/.tsx/.js/.jsx)
pnpm typecheck    # TypeScript check (no emit)

npx convex dev    # Run Convex dev server (required alongside pnpm dev)
```

## File Organization

```
src/
  routes/              # File-based routes (TanStack Router)
    __root.tsx         # Root layout — HTML shell
    index.tsx          # Home / active session dashboard
    api/auth/$.ts      # Better Auth API handler (create when adding auth)
  components/
    ui/                # shadcn/ui components only
    # Domain components go in src/components/, not src/components/ui/
  lib/
    auth.ts            # Better Auth server config (create when adding auth)
    auth-client.ts     # Better Auth browser client (create when adding auth)
    utils.ts           # cn() helper
  router.tsx           # Router instance + module augmentation
  styles.css           # Tailwind theme tokens, dark mode, base styles
  routeTree.gen.ts     # AUTO-GENERATED — never edit manually

convex/
  schema.ts            # Database schema + Better Auth tables (create when adding backend)
  # All queries, mutations, and actions go in convex/
```

## Architecture Patterns

### Routing
- Routes are file-based under `src/routes/`. The route tree auto-generates into `src/routeTree.gen.ts`.
- The root layout (`__root.tsx`) wraps all routes with the HTML shell.
- Create new pages by adding `.tsx` files in `src/routes/`. Use `createFileRoute`.
- API routes are also file-based. The Better Auth handler should live at `src/routes/api/auth/$.ts`.

### Router instance
- Created in `src/router.tsx` via `getRouter()` and registered globally via module augmentation so router types flow throughout the app without prop-drilling.

### Backend (Convex)
- All server logic lives in `convex/`.
- Define the schema in `convex/schema.ts`. Better Auth tables (`users`, `sessions`, `accounts`) are part of the Convex schema.
- Use `query` for reads, `mutation` for writes, `action` for external API calls.
- Convex functions are consumed in React with `useQuery` and `useMutation` from `convex/react`.

### Authentication (Better Auth)
- Server config should go in `src/lib/auth.ts`.
- Browser client should go in `src/lib/auth-client.ts`.
- Better Auth API is exposed via a TanStack Start API route at `src/routes/api/auth/$.ts`.
- Google OAuth is the only provider.
- Protect routes using `beforeLoad` or route loaders that check the session. In Convex functions, use the Better Auth context to identify the current user.

### UI components
- shadcn/ui components live in `src/components/ui/`. Add new ones with `pnpm dlx shadcn add <component>`.
- Domain-specific components (e.g., `TeamCard`, `MatchResult`) go in `src/components/`, NOT in `src/components/ui/`.
- The `cn()` helper in `src/lib/utils.ts` merges Tailwind classes (`clsx` + `tailwind-merge`). Always use it for conditional classes.


### Path alias
- `@/` maps to `src/` (configured in `tsconfig.json` and resolved by `vite-tsconfig-paths`).

### Testing
- Vitest with jsdom + `@testing-library/react`.
- Place tests next to the files they test or in a `__tests__` directory.

## Common Tasks

### Add a new page
1. Create `src/routes/my-page.tsx` using `createFileRoute('/my-page')`.
2. Export a `component` (and optionally `loader`, `beforeLoad`, `head`).
3. The route registers automatically. Import types will generate on dev server start.

### Add a Convex table
1. Add the table definition to `convex/schema.ts`.
2. Write query/mutation functions in `convex/`.
3. Run `npx convex dev` to push the schema.

### Add a shadcn component
```bash
pnpm dlx shadcn add <component>
```
This installs into `src/components/ui/`. Do not modify shadcn internals directly; wrap them in domain components if customization is needed.



## Notes

- This project is in early development. Files like `src/lib/auth.ts`, `convex/schema.ts`, and `src/routes/api/auth/$.ts` do not exist yet and need to be created.
- Refer to `PROJECT.md` for full product requirements, domain definitions, and screen descriptions.

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
