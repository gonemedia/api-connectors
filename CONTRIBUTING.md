# Contributing a connector

1. Copy an existing profile in `profiles/` and edit it. The filename is the `id`.
2. Keep it **keyless** - never commit an API key or token.
3. Set `baseUrl` to the documented API base. Its host is what Skales locks and
   asks the user to confirm.
4. List the endpoints you actually use, with a one-line `summary` each. Prefer the
   vendor's own paths and casing.
5. Fill `docsDigest` with a short, accurate cheat-sheet: auth header, pagination,
   any rate limit, anything non-obvious. This is what the agent reads.
6. Add an entry to `index.json` (`id`, `name`, `file`, `domain`).
7. Do not add LLM / chat-completions APIs here - those belong in a Skales AI
   Provider, not a connector.
8. Run `node validate.mjs`. It checks the profile against the schema and against
   `index.json` - matching ids, a `domain` that really is the host of `baseUrl`,
   a supported auth scheme, endpoints the app can send, and no key anywhere.

Keep it factual and conservative. A connector points an authenticated tool at a
remote host, so accuracy and a correct domain matter.
