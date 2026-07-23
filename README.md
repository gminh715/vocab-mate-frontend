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

## API client

`src/api/client.ts` provides:

- Typed helpers for GET, POST, PATCH, PUT, and DELETE.
- Automatic parsing of the backend's `{ success, data }` envelope.
- Normalized API errors from `{ success: false, error }`.
- Bearer access-token attachment.
- One shared refresh request and one retry after a `401`.
- `credentials: "include"` for the HttpOnly refresh cookie.

`src/api/auth.ts` implements login, session restoration, and logout against the
backend's `/auth` and `/users/me` endpoints.

## Checks

```bash
npm run lint
npm run build
```
