# Vocab Mate Frontend

React + TypeScript + Vite frontend connected to the Vocab Mate NestJS API.

## Development

Start the backend on port `3000`, then run:

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

Vite proxies `/api` to `http://localhost:3000`, so the backend's HttpOnly
refresh-token cookie remains same-origin during local development. Copy
`.env.example` to `.env` and change `VITE_API_PROXY_TARGET` if the backend uses
another address.

The browser API base path defaults to `/api/v1`. For a deployment where the API
is hosted separately, set `VITE_API_BASE_URL` to its full public `/api/v1` URL
and enable credentialed CORS on the backend.

## Project structure

The source follows a layered structure with domain folders inside each layer:

```text
src/
├── api/          # Typed backend calls, grouped by domain
├── app/          # Root providers and application composition
├── components/   # Reusable UI, grouped by domain
├── config/       # Shared infrastructure such as the Axios client
├── contexts/     # Small cross-cutting React contexts
├── hooks/        # TanStack Query and UI hooks, grouped by domain
├── pages/        # Route-level screens, grouped by user flow
├── routes/       # Route tree and access-control composition
├── schemas/      # Zod input and response schemas, grouped by domain
├── types/        # Backend contract types, grouped by domain
└── utils/        # Pure helpers, grouped by domain
```

Use the `@/` alias for imports from `src`. Feature-specific code stays in its
domain; only code reused by unrelated features belongs in `Shared`.

## API client

`src/config/apiClient.ts` owns the shared Axios client, backend envelope parsing,
normalized errors, in-memory access-token handling, one shared refresh request,
and a single retry after `401`. Domain API modules live under `src/api`.

## Guardian and contextual vocabulary flow

Provider credentials belong to the backend and must never use a `VITE_*`
variable. After the backend is configured, an admin can:

1. Open **Admin → News import**, search Guardian metadata, choose an active
   category, and import up to five sanitized draft articles.
2. Open an imported draft, parse its current content, run article analysis,
   and explicitly approve or reject each pending AI candidate.
3. Preview and explicitly publish the article.
4. Open the published article as a learner, select an approved marked term,
   wait for lazy contextual enrichment when needed, and save the resulting
   vocabulary snapshot.

Manual checks:

- Guardian result cards show attribution links and never display article body
  HTML.
- Rejected and pending candidates cannot be opened by a learner.
- A repeated lookup displays the cached contextual result.
- A lookup already being prepared shows a safe retry message.
- A saved vocabulary keeps its original contextual snapshot after later source
  term changes.

`preferredLanguage` controls frontend interface language only. It is not sent
as a Guardian or AI input and does not select translation, enrichment, article,
highlight, or vocabulary behavior.

## Checks

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```
