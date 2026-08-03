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
2. Open an imported draft, parse its current content, and run local WinkNLP
   vocabulary analysis. Accepted unique sentence tokens are immediately marked
   and their learning metadata remains deferred until lookup.
3. Preview and explicitly publish the article.
4. Open the published article as a learner, select an approved marked term,
   wait for lazy contextual enrichment when needed, and save the resulting
   vocabulary snapshot.

Manual checks:

- Guardian result cards show attribution links and never display article body
  HTML.
- WinkNLP terms appear as approved lookup terms; CEFR and display metadata show
  as pending in admin views until the first successful learner lookup.
- A repeated lookup displays the cached contextual result.
- A lookup already being prepared shows a safe retry message.
- A saved vocabulary keeps its original contextual snapshot after later source
  term changes.

`preferredLanguage` controls frontend interface language only. It is not sent
as a Guardian or AI input and does not select translation, enrichment, article,
highlight, or vocabulary behavior.

## Invisible review experience

The dashboard's review card reads `GET /reviews/today` and shows the due count,
an estimated duration, and one Start Review action. Article pages and saved
collections provide optional scoped entry points. Review routes are:

```text
/review                         create or resume from URL source parameters
/review/:sessionId              restore and answer one question at a time
/review/:sessionId/summary      completed-session summary
```

`src/api/Review` contains typed HTTP calls, `src/hooks/Review` owns TanStack
Query state and mutations, and `src/pages/Review` owns transient interaction
state. Durable progress remains on the backend: refresh, Exit, and navigation
restore the active session. The frontend never duplicates a session in Redux or
browser storage.

An answer or skip mutation advances from the `nextQuestion` already included in
that response, avoiding a fetch between questions. Submission is locked while
the mutation is pending. Correct answers show brief feedback and advance
automatically; incorrect answers show the correct meaning and explanation,
explain that the word will return later, and require one Continue action. Hints
are progressive, and multiple-choice and fill-in-the-blank use the same server
grading contract.

There are deliberately no Again, Hard, Good, or Easy controls. The API infers
scheduling privately from the interaction. AI availability is not presented as
a learner decision: cached or rule-based questions keep the session usable when
AI generation is unavailable.

Focused review checks live in `tests/review-ui.test.tsx`,
`tests/reviews-api.test.ts`, and `tests/dashboard-ui.test.tsx`. The UI flow test
asserts at each interaction state that no self-rating button is rendered.

## Checks

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```
