# AGENTS.md — Vocab Mate Frontend

## 1. Project Overview

| Property         | Value                         |
| ---------------- | ----------------------------- |
| Project          | Vocab Mate Frontend           |
| Language         | TypeScript                    |
| Framework        | React 19 + Vite               |
| UI Library       | Material UI v7                |
| State Management | Redux Toolkit + Redux Persist |
| Routing          | React Router DOM v6           |
| Forms            | React Hook Form               |
| HTTP Client      | Axios                         |
| Notifications    | React Toastify                |
| Backend          | NestJS + Prisma + PostgreSQL  |
| API Style        | REST API                      |
| API Base Path    | `/api/v1`                     |

Vocab Mate is a language-learning web application that helps users learn English vocabulary by reading English news articles.

This repository contains the frontend application.

The current MVP does not contain product AI features or an AI learning agent. AI coding tools may assist with implementation, but they must not introduce AI behavior into the product unless explicitly requested.

---

## 2. Current MVP Scope

### 2.1 Backend Modules Already Available

The frontend may integrate with the following completed backend modules:

* Auth
* Users
* Categories
* Articles
* Reading
* Vocabularies
* Collections

### 2.2 Backend Modules Not Yet Available

The following backend modules are not currently ready for complete frontend integration:

* Quizzes
* Reviews
* Analytics

Do not implement complete Quiz, Review, or Analytics workflows unless their backend APIs are confirmed to exist.

Placeholder routes or UI mockups may only be created when explicitly requested.

---

## 3. Sources of Truth

Before implementing a task, inspect relevant project files and follow this priority order:

1. The explicit task request.
2. Actual backend Swagger/OpenAPI documentation.
3. Actual NestJS controllers, DTOs, enums, and response contracts.
4. Existing frontend code and nearby implementation patterns.
5. The API Design document.
6. The SQL database schema for domain understanding only.
7. This `AGENTS.md`.
8. General development conventions.

### Important Rules

* Backend Swagger and DTOs are the source of truth for frontend API types.
* The SQL schema must not be used directly as the frontend API contract.
* Do not invent endpoints, request fields, response fields, query parameters, enum values, roles, or error codes.
* If documentation conflicts with the actual backend implementation, follow the actual backend and report the inconsistency.
* Existing repository conventions take precedence over generic examples in this document.
* An explicit task may authorize changes to protected files.

---

## 4. Core Vocab Mate Business Rules

These rules must be preserved unless the task explicitly changes the product requirements.

### 4.1 MVP Without AI

* Do not call OpenAI, Gemini, or another AI service.
* Do not generate meanings, definitions, examples, translations, summaries, quizzes, or CEFR levels on the frontend.
* Article content and vocabulary metadata are manually managed by administrators.
* The frontend only displays data returned by the backend.
* Do not label a manually prepared feature as AI-powered.

### 4.2 Article Reading

* Article pages render the backend-provided `contentHtml`.
* Do not replace `contentHtml` with plain text rendering.
* Preserve backend-provided article structure and term identifiers.
* Article sentence elements may contain `data-sentence-id`.
* Lookup-enabled term elements may contain `data-term-id`.
* Do not reconstruct term positions by searching raw strings unless explicitly required by the backend contract.
* Do not mutate the article HTML in ways that remove backend identifiers.
* Render HTML only through the existing trusted article-rendering implementation.
* Never render arbitrary unsanitized user input with `dangerouslySetInnerHTML`.

### 4.3 Vocabulary Highlighting

A vocabulary term is eligible for highlighting when:

* Lookup is enabled for the term.
* The term CEFR level is equal to or higher than the current user's CEFR level.
* The backend includes the term in the reader response or highlighted term identifiers.

Rules:

* Prefer backend-provided `highlightedTermIds`.
* Do not duplicate backend CEFR business logic unless the API contract explicitly requires client-side filtering.
* Do not highlight every word found in the article.
* Do not perform an external dictionary lookup.
* Clicking a highlighted term must use the contextual lookup endpoint.
* Display contextual data returned by the backend, including meaning, explanation, examples, part of speech, CEFR level, pronunciation, or sentence translation when available.

### 4.4 Saved Vocabulary

* A saved vocabulary record belongs to the authenticated user.
* Saving vocabulary creates a contextual snapshot from the source article.
* The same lexical word may have different saved meanings in different article contexts.
* Do not merge saved vocabulary items only because they share the same text or lemma.
* A saved vocabulary item may belong to multiple collections.
* Removing an item from one collection must not delete it from other collections.
* Deleting a collection must not delete the user's saved vocabulary items unless the backend contract explicitly states otherwise.

### 4.5 Authorization

* User-owned resources must respect the authenticated user's ownership.
* Admin-only pages and actions require the `ADMIN` role.
* Hiding an admin button is not sufficient authorization; the backend remains authoritative.
* Handle `401`, `403`, and `404` as different states.
* Do not expose admin actions to normal users.

---

## 5. General Agent Behavior

### 5.1 Minimal Coherent Change Principle

Make the smallest coherent set of changes required to complete the task.

A coherent task may require more than one file. For example, implementing a page may legitimately require:

* One page component.
* One API function.
* One request or response type.
* One Redux slice.
* One route entry.

This is allowed when all modified files are directly required for the same requested feature.

Do not:

* Modify unrelated files.
* Reformat unrelated code.
* Rename unrelated variables.
* Move files without a requirement.
* Perform opportunistic cleanup.
* Rewrite working code only to match personal preferences.
* Refactor the entire feature when a local fix is sufficient.

There is no artificial line-count or function-count limit. Scope is controlled by relevance, not by the number of lines.

### 5.2 Proceed Without Unnecessary Interruptions

Do not stop merely because a task affects several related files.

Proceed when:

* The requested outcome is clear.
* The required changes fit the existing architecture.
* No protected behavior must be changed.
* No new dependency is required.

Ask for clarification or report a blocker before modifying code when:

* Two materially different implementations are possible and the requirement does not indicate which one is correct.
* The task requires changing authentication or refresh-token behavior.
* The task requires changing project architecture.
* The task requires a new production dependency.
* The task requires changing the backend API contract.
* The task contradicts current business rules.
* A required backend endpoint does not exist.

### 5.3 No Unrequested Architecture Changes

Do not:

* Change the project folder structure.
* Introduce feature-sliced design, clean architecture, atomic design, or another new architecture.
* Introduce a second API client.
* Introduce another global state manager.
* Add repository or service abstractions that duplicate existing API functions.
* Add generic wrappers without a concrete need.
* Create empty directories or placeholder files.
* Create duplicate components, hooks, utilities, selectors, API functions, or types.

Before creating a new abstraction, search for an existing equivalent.

---

## 6. Allowed and Forbidden Actions

### 6.1 Allowed

The agent may:

* Modify files directly required by the explicit task.
* Fix bugs in isolated locations.
* Add functions to existing files following current patterns.
* Add API functions to `src/apis/index.ts`.
* Add page components under `src/pages/`.
* Add reusable components under `src/components/`.
* Add Redux slices under `src/redux/`.
* Add selectors to an existing or new slice.
* Add utility functions under `src/utils/`.
* Add TypeScript types in the location already used by the repository.
* Add tests following the current test structure.
* Update barrel exports when required by the requested feature.
* Add a route when route creation is explicitly part of the task.
* Update documentation directly related to the implemented change.

### 6.2 Forbidden Without Explicit Permission

Do not:

* Change the project architecture.
* Move or rename major folders.
* Replace Redux Toolkit with Zustand, MobX, Context API, or another global state manager.
* Use React Context as an alternative global application store.
* Replace Material UI with another UI library.
* Add Tailwind CSS, Styled Components, Bootstrap, Ant Design, or another styling framework.
* Change the `~/` path alias.
* Change authentication or refresh-token behavior.
* Change Redux Persist configuration.
* Convert TypeScript files to JavaScript.
* Add mock production endpoints.
* Modify the backend.
* Change backend request or response contracts.
* Add product AI features.
* Implement unavailable backend modules as if they were complete.
* Upgrade major dependency versions.
* add an alternative library for functionality already covered by installed packages.

---

## 7. Protected Files

The following files require explicit task authorization before modification:

* `src/main.tsx`
* `src/App.tsx`
* `src/redux/store.ts`
* `src/theme.ts`
* `src/utils/authorizeAxios.ts`
* `vite.config.ts`
* `package.json`
* Lock files such as `package-lock.json`, `pnpm-lock.yaml`, or `yarn.lock`

### Protected File Rules

* A request to add or change an application route authorizes the minimum necessary change to `src/App.tsx`.
* A request to register a Redux slice authorizes the minimum necessary change to `src/redux/store.ts`.
* A request to change global theme tokens authorizes the minimum necessary change to `src/theme.ts`.
* Installing a dependency requires explicit approval and must update both `package.json` and the relevant lock file.
* Do not edit protected files for cleanup or formatting only.

---

## 8. Existing Dependencies

Prefer existing dependencies whenever they already solve the requirement.

| Category        | Package                             |
| --------------- | ----------------------------------- |
| UI              | `@mui/material`                     |
| Icons           | `@mui/icons-material`               |
| MUI Styling     | `@emotion/react`, `@emotion/styled` |
| State           | `@reduxjs/toolkit`, `react-redux`   |
| Persistence     | `redux-persist`                     |
| Routing         | `react-router-dom`                  |
| Forms           | `react-hook-form`                   |
| HTTP            | `axios`                             |
| Real-time       | `socket.io-client`                  |
| Utilities       | `lodash`, `moment`                  |
| Notifications   | `react-toastify`                    |
| Confirmation    | `material-ui-confirm`               |
| Markdown Editor | `@uiw/react-md-editor`              |

### Dependency Rules

* Do not add a new dependency when installed packages can reasonably implement the requirement.
* Do not add an alternative date, form, HTTP, notification, icon, or state-management library.
* Do not upgrade major versions without explicit permission.
* Before proposing a dependency, explain:

  * Why existing dependencies are insufficient.
  * What problem the dependency solves.
  * Bundle or maintenance implications.
  * Whether a small local implementation is more appropriate.

---

## 9. File Naming and Imports

### 9.1 File Naming

Follow nearby repository patterns.

Default conventions:

* React components: `PascalCase.tsx`
* Pages: `PascalCase.tsx`
* Hooks: `useCamelCase.ts`
* Utilities: `camelCase.ts`
* Redux slices: `camelCaseSlice.ts`
* Type files: follow the existing repository convention
* CSS files: match the component name, such as `ArticleReader.css`

Do not rename existing files only to enforce these conventions.

### 9.2 Import Order

Use the following order:

1. React and React hooks.
2. Third-party libraries.
3. Local modules imported through `~/`.
4. Relative imports.
5. Styles and assets when the current file pattern places them last.

Example:

```tsx
import { useEffect, useState } from 'react'

import { Box, Button, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'

import { getArticleAPI } from '~/apis'
import { selectCurrentUser } from '~/redux/userSlice'

import './ArticlePage.css'
```

### 9.3 Import Alias

* Use the existing `~/` alias for imports from `src/`.
* Do not replace alias imports with long relative paths.
* Use relative imports only when consistent with nearby files or when importing styles colocated with a component.

Example:

```ts
import { loginAPI } from '~/apis'
```

---

## 10. TypeScript Rules

* Keep all new application code in TypeScript.
* Prefer explicit request and response interfaces.
* Do not use `any` unless unavoidable at a third-party boundary.
* Do not use `Record<string, any>` for known API payloads.
* Prefer `unknown` over `any` for untrusted error data.
* Narrow unknown values before accessing properties.
* Reuse backend enum values exactly.
* Do not duplicate the same interface in multiple feature files.
* Avoid unsafe type assertions.
* Do not use non-null assertions merely to suppress errors.
* Keep component props explicitly typed.
* Do not create database-shaped frontend models unless the endpoint actually returns that shape.
* Do not expose Prisma model types directly to the frontend.

Example:

```ts
export interface GetArticlesParams {
  page?: number
  limit?: number
  categoryId?: string
  cefrLevel?: string
  search?: string
}

export interface ArticleListItem {
  id: string
  title: string
  summary: string | null
  cefrLevel: string
  publishedAt: string | null
}
```

---

## 11. React Component Rules

### 11.1 Component Style

Follow the style used by nearby files.

For new page components, prefer a named function when no local convention exists:

```tsx
interface ArticlePageProps {
  articleId: string
}

function ArticlePage({ articleId }: ArticlePageProps) {
  return <div>{articleId}</div>
}

export default ArticlePage
```

Do not mass-convert existing arrow components into function declarations.

### 11.2 Component Organization

Use this general order:

1. Imports.
2. Types and interfaces.
3. Constants local to the file.
4. Component definition.
5. Hooks and selectors.
6. Derived values.
7. Effects.
8. Event handlers.
9. Rendering.
10. Export.

### 11.3 Component Responsibilities

* Keep page components responsible for page composition and screen-level behavior.
* Move repeated visual elements into reusable components.
* Do not extract one-use components merely to reduce line count.
* Do not create components that only wrap one MUI component without adding meaningful behavior.
* Avoid deeply nested conditional JSX.
* Use early returns for major loading, error, forbidden, and not-found states when clearer.
* Use semantic HTML through appropriate MUI components and `component` props.
* Provide labels for form controls and icon-only buttons.
* Preserve keyboard accessibility.

### 11.4 State Choice

Use:

* `useState` for temporary UI state.
* Redux for authentication, current user, and truly shared application state.
* Component or page state for server data used by only one screen, unless the repository already stores that resource in Redux.
* Memoization only when it solves a demonstrated rendering or dependency problem.

Do not:

* Put modal visibility, input text, hover state, or one-page loading flags into Redux without a concrete need.
* Persist large article HTML, temporary form values, API errors, or loading flags.
* Duplicate the same server response in both Redux and local state.
* add Context API as a second global-state architecture.

---

## 12. Redux Rules

* Follow the structure and conventions of existing slices such as `userSlice.ts`.
* Use `createSlice`.
* Use typed state interfaces.
* Export actions, reducer, and selectors following the existing pattern.
* Access state through selectors instead of repeatedly reading deep state paths.
* Keep reducers synchronous and free of side effects.
* Keep non-serializable values out of Redux state.
* Do not store Axios responses, DOM elements, class instances, functions, or promises in Redux.
* Do not modify Redux Persist configuration without explicit permission.
* Do not persist transient API loading or error states.
* Do not create a new slice when the state belongs to an existing slice.
* Register a new reducer in `store.ts` only when the requested feature requires global state.

---

## 13. API Development Rules

### 13.1 API Location

Add API functions to:

```text
src/apis/index.ts
```

Follow the established API naming and export conventions.

Do not create a new API layer or a second Axios client unless explicitly requested.

### 13.2 Authentication

* Authenticated endpoints must use `getAuthorizedInstance()`.
* Public endpoints must use the existing public `apiClient`.
* Do not read the refresh token from JavaScript.
* Do not store the refresh token in Redux, local storage, or session storage.
* Do not modify refresh logic in `authorizeAxios.ts` without explicit permission.
* Do not manually duplicate token refresh handling inside components.
* Do not log access tokens or authentication headers.

### 13.3 API Function Pattern

Use typed parameters and preserve the existing Axios response-return pattern.

```ts
export interface GetArticlesParams {
  page?: number
  limit?: number
  categoryId?: string
  cefrLevel?: string
}

export const getArticlesAPI = async (params: GetArticlesParams) => {
  const authorizedAxios = await getAuthorizedInstance()

  return authorizedAxios.get(`${API_ROOT}/v1/articles`, {
    params
  })
}
```

For a public endpoint:

```ts
export const getPublishedArticleAPI = async (articleId: string) => {
  return apiClient.get(`${API_ROOT}/v1/articles/${articleId}`)
}
```

Confirm how `API_ROOT` is currently defined before constructing URLs. Do not accidentally produce paths such as `/api/api/v1`.

### 13.4 API Error Handling

* API functions should not display toast notifications.
* API functions should not silently catch and discard errors.
* Handle user-facing errors in the page, component, Redux thunk, or existing feature layer.
* Preserve Axios errors for callers unless the project already has a shared error-normalization function.
* Avoid displaying raw backend stack traces or internal error objects.
* Use backend error messages only when safe and user-friendly.
* Distinguish validation, unauthorized, forbidden, not-found, conflict, and server errors where relevant.

### 13.5 API Contract Rules

Before adding an API function, confirm:

* HTTP method.
* Endpoint path.
* Authentication requirement.
* Path parameters.
* Query parameters.
* Request body.
* Response data envelope.
* Pagination format.
* Error responses.
* Relevant enum values.

Do not infer an API contract only from the SQL schema.

---

## 14. Forms and Validation

* Use React Hook Form for non-trivial forms.
* Follow existing form conventions.
* Use backend-compatible field names.
* Show field-level validation errors where available.
* Prevent duplicate submissions.
* Disable the submit action while the request is in progress.
* Trim text inputs where appropriate.
* Do not convert optional empty fields into invalid payload values.
* Do not send empty strings when the API expects `undefined` or an omitted field.
* Do not implement validation rules that contradict backend DTO validation.
* Preserve user-entered values after a recoverable API error.

---

## 15. Material UI and Styling

### 15.1 UI Components

* Use Material UI components for application UI.
* Reuse existing layout and shared components.
* Do not replace MUI elements with a different UI library.
* Native semantic elements may be used where more appropriate, especially inside article content and accessibility structures.
* Do not use plain clickable `div` elements when `Button`, `IconButton`, `Link`, or another semantic component is appropriate.

### 15.2 Styling Priority

Use styling in this order:

1. Existing shared components.
2. Existing theme tokens.
3. MUI `sx` for local component styles.
4. A colocated CSS file for complex selectors, article HTML, animations, or styles difficult to express clearly with `sx`.

Do not:

* Mix `style={{ ... }}` with `sx` without a specific third-party requirement.
* Hard-code colors repeatedly when an existing theme token exists.
* Modify the global theme for one local component.
* Add Tailwind CSS or another styling system.
* Use excessive nested selectors.
* Add global CSS rules that unintentionally affect unrelated pages.

### 15.3 Theme

* Follow the existing implementation in `src/theme.ts`.
* Do not assume a specific theme factory if the repository already uses another supported MUI configuration.
* Do not change `src/theme.ts` without explicit task permission.
* Use `theme.palette`, `theme.spacing`, `theme.typography`, `theme.shape`, and breakpoints instead of duplicating design tokens.

### 15.4 Responsive Design

New pages should remain usable at:

* Mobile widths.
* Tablet widths.
* Desktop widths.

Avoid fixed dimensions that cause horizontal overflow. Article-reading content should preserve readable line length and spacing.

---

## 16. Loading, Empty, Error, and Feedback States

Every data-driven page must consider the relevant states:

* Initial loading.
* Background refresh.
* Empty data.
* Successful data.
* Validation failure.
* API failure.
* Unauthorized.
* Forbidden.
* Not found.
* Destructive-action confirmation.
* Successful create, update, or delete feedback.

Rules:

* Do not use one generic message for all errors.
* Do not show an empty-state message while the initial request is still loading.
* Do not leave stale loading states after errors.
* Use `toast.error()` or existing notification patterns for user-facing operation errors.
* Use inline errors when the user needs the error to correct a field or page state.
* Log errors only when useful for development.
* Do not log secrets, tokens, passwords, full authorization headers, or sensitive user data.

---

## 17. Routing Rules

* Use React Router DOM v6 patterns already present in the repository.
* Do not introduce another router.
* Add routes only when requested or required by the requested feature.
* Use existing authenticated and admin route guards.
* Do not duplicate authorization checks in every page if a route guard already handles them.
* Page-level permission checks may still be used for individual actions.
* Preserve existing route naming conventions.
* Avoid hard-coded navigation URLs when route constants already exist.
* Provide appropriate not-found and forbidden behavior.

Changes to `src/App.tsx` must remain limited to the requested routing change.

---

## 18. Security Rules

* Never commit secrets or real credentials.
* Use Vite environment variables for public configuration.
* Remember that every `VITE_` variable is exposed to the browser.
* Do not place private API keys in frontend environment variables.
* Do not log tokens.
* Do not store refresh tokens in browser-managed JavaScript storage.
* Do not bypass backend authorization.
* Do not trust role or ownership information supplied only by route parameters.
* Do not render arbitrary unsanitized HTML.
* Do not expose backend internal errors to users.
* Do not add development authentication bypasses.
* Do not disable TypeScript or lint rules globally to hide an error.

---

## 19. Comments and Documentation

* Use English for code comments and TSDoc.
* Keep comments short and meaningful.
* Explain why a non-obvious decision exists, not what straightforward code does.
* Do not leave commented-out implementation code.
* Do not add large header comments to every file.
* Document reusable utilities or complex public functions when necessary.
* Update README or feature documentation only when the task changes setup, environment variables, commands, or user-facing behavior.

---

## 20. Testing and Verification

Use scripts already defined in `package.json`.

For every meaningful change, run the relevant available checks:

* Formatting.
* ESLint.
* Type checking.
* Unit or component tests.
* Production build.

Typical examples may include:

```bash
npm run lint
npm run type-check
npm run test
npm run build
```

Do not assume these exact scripts exist. Inspect `package.json` first.

Rules:

* Add tests for important transformations, selectors, reducers, validation, route guards, and interaction logic when a testing setup exists.
* Do not introduce a new testing framework without permission.
* Do not delete or weaken tests merely to make the task pass.
* Do not claim a command passed unless it was actually executed.
* If a check cannot run, report the reason clearly.
* Review the final diff for unrelated changes before finishing.

---

## 21. Task Execution Workflow

For each task:

1. Read this `AGENTS.md`.
2. Inspect `package.json`.
3. Inspect the relevant existing files.
4. Search for reusable components, API functions, selectors, types, and utilities.
5. Verify relevant backend endpoints and DTOs.
6. Identify the smallest coherent change set.
7. Implement the requested behavior.
8. Handle applicable loading, empty, error, and success states.
9. Run relevant checks.
10. Review the diff.
11. Remove unused imports, dead code, debug logs, duplicated logic, and unintended changes.
12. Report the result accurately.

For a larger task, write a concise implementation plan before editing. Do not request confirmation merely because several directly related files are required.

---

## 22. Output Rules

When reporting completed work, include:

1. Summary of the implemented behavior.
2. Files created.
3. Files modified.
4. API endpoints integrated.
5. Important implementation decisions.
6. Commands executed.
7. Lint, type-check, test, and build results.
8. Remaining limitations or backend dependencies.

Do not:

* Output incomplete code containing placeholders such as `// rest of code`.
* Claim functionality was tested when it was not.
* Hide failed checks.
* Include unrelated recommendations in place of implementation.
* Report files as modified when they were not changed.
* Generate large documentation sections unless requested.

When the user asks for code rather than direct repository edits, provide complete code for the requested file or clearly delimited changed sections.

---

## 23. Definition of Done

A frontend task is complete only when all applicable conditions are satisfied:

* The requested behavior is implemented.
* The implementation uses the real backend contract.
* No undocumented endpoint or field was invented.
* TypeScript types are safe and appropriate.
* Existing architecture is preserved.
* Existing authentication and Redux Persist behavior is preserved.
* Material UI and current styling conventions are followed.
* Loading, error, empty, and success states are handled where relevant.
* User and admin permissions are respected.
* No product AI feature was introduced.
* No unrelated file was changed.
* No unnecessary dependency was added.
* No unused imports or obvious dead code remain.
* Relevant tests pass.
* Type checking passes.
* Linting passes.
* Production build passes.
* Any check that could not be executed is reported honestly.

---

## 24. Quick Reference

| Task                         | Preferred Location                                             |
| ---------------------------- | -------------------------------------------------------------- |
| Add an API endpoint function | `src/apis/index.ts`                                            |
| Add shared global state      | `src/redux/`                                                   |
| Add a page                   | `src/pages/[FeatureName]/`                                     |
| Add a reusable component     | `src/components/[Category]/`                                   |
| Add a utility                | `src/utils/`                                                   |
| Add an asset                 | `src/assets/` and relevant barrel export                       |
| Add a route                  | `src/App.tsx`, only when authorized                            |
| Register a Redux reducer     | `src/redux/store.ts`, only when authorized                     |
| Change global theme          | `src/theme.ts`, only when authorized                           |
| Change Axios authentication  | `src/utils/authorizeAxios.ts`, only when explicitly authorized |

---

## 25. Final Pre-Submission Checklist

* [ ] I changed only files required by the task.
* [ ] I inspected existing patterns before adding code.
* [ ] I reused existing components, utilities, types, and selectors where appropriate.
* [ ] I used the `~/` import alias consistently.
* [ ] I used typed API requests and responses.
* [ ] I did not use unnecessary `any`.
* [ ] I did not invent an API endpoint or response field.
* [ ] I used Material UI and existing theme conventions.
* [ ] I preserved authentication and token refresh behavior.
* [ ] I preserved Redux Persist configuration.
* [ ] I did not introduce product AI behavior.
* [ ] I handled relevant loading, empty, error, and success states.
* [ ] I did not leave debug logs or commented-out code.
* [ ] I ran the available relevant checks.
* [ ] I reviewed the final diff.
* [ ] I reported verification results truthfully.
