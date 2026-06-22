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
    "queryParam": ""                          // for queryParam, e.g. ?api_key=KEY
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

OAuth2 is not covered by a pasted key; use connectors only for static-credential
APIs.

## Domain lock

Skales calls only the host of `baseUrl`, confirmed by the user on import. A changed
`baseUrl` in a later library version requires fresh confirmation; Skales never
silently re-points a connector you already trust.

## Safety

A connector is data, never code. But it points an authenticated tool at a remote
host, so treat importing one like running someone's config. Keep connectors
keyless, accurate, and on-topic. Mutating endpoints (POST/PUT/PATCH/DELETE) are
gated behind a confirmation in Skales.
