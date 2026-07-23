# Vocab Mate Frontend

React + TypeScript + Vite frontend connected to the Vocab Mate NestJS API.

## Development

Copy the environment example and start the backend on port `3000`:

```sh
cp .env.example .env
```

Then run:

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

Vite proxies `/api` to `http://localhost:3000`, so the backend's HttpOnly
refresh-token cookie remains same-origin during local development. Copy
`.env.example` to `.env` and change `VITE_API_PROXY_TARGET` if the backend uses
another address.

`VITE_API_BASE_URL` uses the full versioned API base path (Approach B):

```dotenv
VITE_API_BASE_URL=/api/v1
```

API calls append feature paths such as `/auth/login`; they must not append
another `/api` or `/v1` segment. `VITE_API_PROXY_TARGET` is only the local
proxy's upstream origin and must not contain `/api/v1`.

For a deployment where the API is hosted separately, set
`VITE_API_BASE_URL` to its full public URL ending in `/api/v1`. Cross-origin
refresh cookies require credentialed CORS and compatible cookie settings on the
backend. The current local setup avoids that requirement by using Vite's
same-origin proxy.

## API client

`src/api/client.ts` provides:

- Typed helpers for GET, POST, PATCH, PUT, and DELETE.
- Automatic parsing of the backend's `{ success, data }` envelope.
- Normalized API errors from `{ success: false, error }`.
- Bearer access-token attachment.
- One shared refresh request and one retry after a `401`.
- `credentials: "include"` for the HttpOnly refresh cookie.

`src/apis/index.ts` implements registration, login, logout, and the authoritative
current-user request. Session restoration runs once from `src/App.tsx` through
the non-persisted Redux session lifecycle.

## Checks

```bash
npm run lint
npm run build
```
