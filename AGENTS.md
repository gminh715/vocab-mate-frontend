# AGENTS.md

## Project overview

Vocab Mate is a Vite + React + TypeScript frontend for learning English vocabulary through news articles.

Current MVP constraints:

- No AI or AI Agent features.
- Admins manually manage article content, sentence translations, vocabulary metadata, examples, and quizzes.
- The frontend consumes prepared backend data and follows the existing API contract.
- Expected stack: Material UI, React Router, TanStack Query, Axios, React Hook Form, and Zod.

These instructions apply to the entire repository unless a nearer nested `AGENTS.md` provides more specific rules.

## Critical rules

- Follow the existing repository architecture and naming conventions before introducing new patterns.
- Treat Swagger/OpenAPI, backend DTOs, and existing API code as the source of truth.
- Do not invent request fields, response fields, enum values, pagination shapes, cookie behavior, or error formats.
- Do not add AI-generated explanations, translations, summaries, recommendations, or quizzes to the MVP.
- Do not refactor unrelated modules or redesign unrelated screens.
- Do not add dependencies or architectural layers without a demonstrated need.
- Preserve unrelated working-tree changes.
- Never expose, log, or persist refresh tokens in JavaScript-accessible storage.
- Do not reparse backend-prepared article HTML or generate vocabulary content in the frontend.

## Source-of-truth priority

When guidance conflicts, use this order:

1. The user's current explicit request.
2. The nearest applicable `AGENTS.md`.
3. Backend API contracts and DTOs.
4. Existing repository conventions.
5. Installed skill guidance and general best practices.

## Repository map

Inspect the actual repository before editing. Prefer the existing feature-based organization:

```text
src/
├── App.tsx                  # Root component — định nghĩa toàn bộ routes
├── main.tsx                 # Entry point — khởi tạo React, Redux, Theme
├── index.css                # Global CSS tối thiểu
├── theme.ts                 # Cấu hình MUI theme (màu sắc, typography...)
│
├── api/                    # Lớp giao tiếp với backend
├── components/              # Shared UI components dùng lại nhiều nơi
├── pages/                   # Từng trang của ứng dụng
├── redux/                   # Global state management (Redux Toolkit)
├── utils/                   # Hàm tiện ích, hằng số, cấu hìnhs
```

Placement rules:

- Keep feature-specific code inside its owning feature.
- Move code to `shared` only when multiple unrelated features genuinely reuse it.
- Do not create empty directories, placeholder files, duplicate utilities, or speculative abstractions.
- Do not introduce frontend repository/service layers unless the current codebase already uses them.

## Commands

Inspect `package.json` before running or documenting commands. Use only the repository's configured package manager and scripts.

Look for scripts serving these purposes:

- Development server
- Type checking
- Linting
- Focused and full test runs
- Production build

Rules:

- Do not invent command names that are absent from `package.json`.
- Prefer focused tests during development, then run the broader relevant checks before finishing.
- Do not install packages or modify the lockfile unless the task requires a dependency change.
- Never claim a command passed unless it was executed successfully.

## Workflow

Before editing:

1. Read this file and any nearer nested `AGENTS.md`.
2. Inspect `package.json`, relevant source files, routes, providers, API utilities, shared components, and types.
3. Search for reusable code before creating new code.
4. Read the relevant Swagger/OpenAPI document, API design, backend DTO, or controller.
5. Check `git status` and preserve unrelated changes.
6. Use installed React, frontend, and web-design skills when available; repository rules and API contracts take precedence.

For multi-file tasks:

1. Identify the affected user flow and current implementation.
2. Make a short, concrete plan.
3. Implement the smallest complete change.
4. Run the relevant checks.
5. Review the diff for unrelated changes, duplication, and contract mismatches.

## Architecture and state management

- Use functional React components and hooks.
- Components must not call Axios directly.
- Use feature API functions and TanStack Query hooks for server communication.
- Use TanStack Query for server state.
- Use React Hook Form for form state.
- Use URL search parameters for shareable filters, sorting, and pagination.
- Use local state for temporary UI state.
- Keep authentication context limited to session and identity concerns.
- Do not duplicate server state in Context or another global store.
- Avoid `useEffect` for derived values or event-driven behavior.
- Add memoization only when it solves an observable or obvious performance issue.

Do not introduce Redux, Zustand, Tailwind CSS, another UI library, HTTP client, form library, or validation library without explicit approval.

## TypeScript and API integration

- Keep strict TypeScript enabled.
- Do not use `any`, `@ts-ignore`, or unsafe assertions to bypass errors.
- Use `unknown` and narrow safely when handling external data or errors.
- Match backend enums, nullable fields, request DTOs, and response DTOs exactly.
- Separate form values from API payloads when their shapes differ.
- Use the existing shared HTTP client.
- Keep API functions free of navigation, toast, and presentation logic.
- Use stable, feature-specific TanStack Query keys.
- Invalidate only affected queries.
- Normalize API errors before presenting them to users.
- Do not automatically retry validation, authentication, authorization, or unsafe mutation failures.

When a contract is unclear, inspect available API documents and backend code. Complete unblocked work and report the unresolved contract instead of inventing behavior.

## Authentication invariants

Follow the actual backend contract. The expected design is:

- Access token stored in memory.
- Refresh token managed through an HttpOnly cookie.
- `/api/v1/users/me` is the source of truth for the current user and role.
- Protected routes wait for session initialization before rendering private content.
- Concurrent `401` responses share a single refresh operation.
- The original request is retried at most once after refresh.
- Failed refresh and logout clear credentials, authenticated state, and private user-specific query data.

Never:

- Store refresh tokens in localStorage, sessionStorage, or other JavaScript-accessible storage.
- Log credentials, access tokens, refresh tokens, or sensitive authentication responses.
- Treat hidden UI or client-side guards as authoritative authorization.
- Allow redirect parameters to navigate to external origins.

## Vocab Mate domain invariants

### Article reader

- Render backend-prepared `content_html` through a shared article renderer.
- Use stable backend markers such as `data-sentence-id` and `data-term-id`.
- Use event delegation for vocabulary-term interactions.
- Fetch contextual term details by backend identifier.
- Debounce or throttle reading-progress updates.
- Use `dangerouslySetInnerHTML` only for HTML sanitized according to the backend contract.

Do not:

- Reparse article sentences into a competing frontend model.
- Guess term offsets.
- Modify article HTML through brittle string replacement.
- Generate explanations, translations, examples, summaries, or vocabulary recommendations.

### CEFR highlighting

A term is eligible for highlighting when its CEFR level is equal to or higher than the user's current CEFR level.

- Prefer backend-provided highlight state when available.
- Do not calculate CEFR in the frontend.
- Do not introduce another recommendation rule without an explicit requirement.

### Vocabulary and collections

- Vocabulary is contextual to a term occurrence in an article sentence.
- Do not merge saved vocabulary items solely because they share a lemma.
- Use backend identifiers for mutations.
- One saved vocabulary item may belong to multiple collections.
- Removing an item from a collection must not delete the saved vocabulary item unless the API explicitly defines that behavior.

### Quiz and review

- Use backend-provided questions, grading, scores, results, and review-session state.
- Do not expose correct answers before submission unless the contract explicitly allows it.
- Do not treat client-calculated scores as authoritative.

## UI, accessibility, and security

- Use Material UI and the existing theme.
- Reuse existing components before creating new ones.
- Support mobile and desktop layouts.
- Provide meaningful loading, empty, error, disabled, and success states.
- Use semantic HTML, associated form labels, visible focus, keyboard support, and accessible names for icon buttons and dialogs.
- Do not redesign unrelated screens during a feature task.
- Never commit secrets, credentials, tokens, private keys, or production configuration.
- Treat `VITE_*` variables as public build-time values, not secrets.
- Do not expose raw server errors or sensitive payloads to users.

## Testing and definition of done

Prioritize focused tests for high-risk behavior when the repository has a test setup, especially:

- Authentication and refresh handling.
- Route guards and role authorization.
- Article term lookup.
- Vocabulary saving and collection membership.
- Quiz answer submission.

A task is complete only when:

- The requested user flow works against the documented API contract.
- The change follows existing architecture and naming conventions.
- Loading, error, empty, and success states are handled where relevant.
- No unnecessary dependency or unrelated refactor was introduced.
- Relevant type checks, lint checks, tests, and production build checks pass, or limitations are reported accurately.

## Git and change safety

- Keep diffs focused.
- Leave unrelated files and working-tree changes untouched.
- Do not reset user changes, rewrite history, force push, or create commits unless explicitly requested.
- Do not reformat the entire repository for a local feature.
- Do not modify generated files or lockfiles unless the task legitimately requires it.

## Completion report

After implementation, report:

1. Behavior implemented.
2. Files created, modified, or deleted.
3. Important architecture and API decisions.
4. Exact commands executed and their results.
5. Remaining limitations, unresolved contracts, or manual verification still required.
