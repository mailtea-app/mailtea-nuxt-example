# Mailtea + Nuxt Example

This example shows how to use [Mailtea](https://mailtea.app) with Nuxt to send an
email from a form, through a server route that keeps your API key off the client.

## Prerequisites

To get the most out of this guide, you'll need to:

- [Create an API key](https://studio.mailtea.app/api-keys)
- [Verify your domain](https://docs.mailtea.app/docs/documentation/domains)
- Node 22.19+, 24.11+, or 26+ — the versions Nuxt 4 supports

## Instructions

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and add your API key:
   ```bash
   cp .env.example .env
   ```
3. Run it:
   ```bash
   npm run dev
   ```
   Open http://localhost:3000, fill in the form, and send. `nuxt dev` loads `.env`
   for you; in production you set the same variables as real environment variables.

## Keeping the API key on the server

`nuxt.config.ts` declares `runtimeConfig.mailteaApiKey`. Keys at the top level of
`runtimeConfig` are server-only: Nuxt fills them from their `NUXT_`-prefixed
environment variable when the server boots, and never includes them in the client
bundle. Only keys under `runtimeConfig.public` are sent to the browser.

`server/api/send.post.ts` is the only file that reads the key, and server routes
never run in the browser. The page posts to `/api/send`, not to the Mailtea API,
so the key never leaves your server.

## What this example covers

- Sending an email with `mailtea-sdk` from a Nuxt server route
- Reading the API key through `useRuntimeConfig()` so it stays server-side
- Driving a form with `useFetch(..., { immediate: false })` and showing the returned email id
- Turning a `MailteaError` into the status and message the browser sees, so a rejected
  send says whether the domain is unverified or the address was bad
- Escaping the submitted text before it becomes the HTML body

## Tests

```bash
npm test
```

The tests run against a bundled mock Mailtea server, so they need no API key and
make no network calls. They mount the real route in an h3 server and post to it,
so body parsing and error-to-status mapping are exercised for real.

Any Node version from the prerequisites runs them. The test imports the TypeScript
route directly and relies on Node's built-in type stripping, which is on by default
from Node 22.18 — on anything older the run fails with `ERR_UNKNOWN_FILE_EXTENSION`
rather than quietly skipping.

## Learn more

- [Documentation](https://docs.mailtea.app)
- [API reference](https://docs.mailtea.app/docs/api-reference)
- [Node.js SDK](https://github.com/mailtea-app/mailtea-node) ·
  [Python SDK](https://github.com/mailtea-app/mailtea-python) ·
  [MCP server](https://github.com/mailtea-app/mailtea-mcp)
