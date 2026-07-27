# Connector schema

A connector is a single JSON object. `id`, `name`, `baseUrl`, and `auth.scheme`
are required; everything else is optional.

```jsonc
{
  "id": "sevdesk",                            // unique slug, also the filename
  "name": "sevDesk",                          // display name
  "baseUrl": "https://my.sevdesk.de/api/v1",  // API base; its host is the locked domain
  "auth": {
    "scheme": "apiKeyHeader",                 // bearer | apiKeyHeader | queryParam | basic
    "headerName": "Authorization",            // for apiKeyHeader: the key is sent as this header's value
    "valuePrefix": "",                        // optional prefix, e.g. "Bearer " for bearer-in-a-header
    "queryParam": "",                         // for queryParam, e.g. ?api_key=KEY

    // Static, NON-SECRET extras sent on every call. Some APIs need a second,
    // public value alongside the secret one: Notion requires a Notion-Version
    // header, Adzuna wants a public app_id next to the secret app_key. These
    // are plain text and visible; the secret auth header or param still wins on
    // a name collision.
    "headerExtras": { "Notion-Version": "2022-06-28" },
    "queryExtras":  { "app_id": "12345678" }
    // The API KEY is NEVER stored in a profile. The user supplies it locally in Skales.
  },
  "endpoints": [
    {
      "method": "GET",                        // GET | POST | PUT | PATCH | DELETE
      "path": "/contact",                     // appended to baseUrl
      "summary": "List contacts",             // one line, what it does
      "params": [                             // optional
        { "name": "limit", "in": "query", "required": false, "description": "Max rows" }
      ]
    },
    { "method": "POST", "path": "/voucher", "summary": "Create a voucher" }
  ],
  "docsUrl": "https://api.sevdesk.de/",       // optional, where the docs live
  "docsDigest": "Short cheat-sheet the agent reads: auth, pagination, rate limit, anything non-obvious.",
  "notes": "Why this connector exists."       // optional, human-only
}
```

## Auth schemes

- `bearer` - sends `Authorization: Bearer <key>`.
- `apiKeyHeader` - sends `<headerName>: <valuePrefix><key>`. Set `valuePrefix` to
  `"Bearer "` for bearer-in-a-header, or leave it empty for a raw token (sevDesk).
- `queryParam` - appends `?<queryParam>=<key>` to every request.
- `basic` - sends `Authorization: Basic base64(<key>)`.

- `oauth2ClientCredentials` - the client-credentials grant. `key` is the client
  SECRET, `clientId` the public id, and `tokenUrl` the token endpoint, which may
  sit on a different host than `baseUrl`. Skales fetches and refreshes the token
  itself.

An OAuth2 flow that needs a browser round-trip (authorization code) is not
covered; connectors are for credentials you can paste.

## Domain lock

Skales calls only the host of `baseUrl`, confirmed by the user on import. A changed
`baseUrl` in a later library version requires fresh confirmation; Skales never
silently re-points a connector you already trust.

## Safety

A connector is data, never code. But it points an authenticated tool at a remote
host, so treat importing one like running someone's config. Keep connectors
keyless, accurate, and on-topic. Mutating endpoints (POST/PUT/PATCH/DELETE) are
gated behind a confirmation in Skales.

## Validating a profile

`node validate.mjs` checks every profile against this schema and against
`index.json`: ids and filenames agree, the index's `domain` really is the host of
`baseUrl` (that host is what the user confirms, so the two must not disagree),
the auth scheme is one the app implements, every endpoint has a method the app
can send and a summary an agent can choose from - and no profile carries a key.
Run it before opening a pull request; it is what CI would run.
