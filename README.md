# API Connectors

Community connector profiles that let a Skales agent talk to any REST API from
its documentation, without a per-tool release. A profile describes WHERE an API
lives and WHICH endpoints it has; you supply your own key locally in Skales.

Built for [Skales](https://skales.app). The profiles are plain data.

## What a connector is

A connector is a single JSON object: a base URL, an auth scheme (NOT the key),
and a list of endpoints with a short description of each. Skales reads it, and
its `connector_request` tool calls the API on your behalf with your key injected
server-side. It is MCP-lite for the long tail of REST APIs: no server to run, no
SDK, configured in a couple of minutes.

## Security model (read this)

A connector profile is more powerful than an LLM profile: it points an
authenticated tool at a remote host. So the rules are strict:

- **Profiles here are keyless templates.** They never contain an API key. You add
  your key locally in Skales (Settings, API Connector); it stays on your machine,
  encrypted, and is never committed here or sent anywhere except the connector's
  own domain.
- **The base URL is the trust anchor.** Skales shows you the exact domain a
  connector will call and asks you to confirm it before the connector is usable.
- **A library update never silently re-points a confirmed connector's domain.** A
  changed base URL needs your fresh confirmation. This stops a malicious update
  from harvesting your key.
- **Calls are domain-locked and SSRF-guarded.** A connector can only reach its own
  confirmed host; private and loopback addresses are blocked.
- **Writes ask first.** GET runs automatically; POST, PUT, PATCH and DELETE
  require your confirmation in chat.

Import only connectors you trust, and read what a connector adds before relying
on it.

## How Skales uses them

In Skales: **Settings, API Connector**. Add a connector by pasting the API docs
(or an OpenAPI/Swagger spec, which is parsed deterministically), or by importing a
template from this library, then add your key and confirm the domain. Trigger a
connector in chat with `#name` (for example `#sevdesk`). `index.json` is a
manifest so the app can list and fetch the current set.

## Not for LLM APIs

If you paste an LLM/chat-completions API here, Skales points you to **Settings, AI
Provider (Custom, OpenAI-compatible)** instead. A connector calls an API as a
one-shot tool; to USE a model you want it as a provider (streaming, tool use, the
full loop).

## Schema

See [SCHEMA.md](./SCHEMA.md).

## License

The connector data here is provided for use with Skales and compatible tools.
Skales is BSL-1.1. These connectors are configuration data, not Skales source.
