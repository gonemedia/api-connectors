#!/usr/bin/env node
/**
 * validate.mjs - the gate for this library.
 *
 * A connector profile is data, but it is data that points an AUTHENTICATED tool
 * at a remote host. A typo'd base URL, a scheme the app does not implement, or
 * an id that disagrees with the index does not fail loudly at import time - it
 * fails as a confusing 404 on someone else's machine, with their key attached.
 *
 * So the rules are checked here rather than trusted:
 *
 *   - index.json and profiles/ agree, in both directions
 *   - the domain in the index is really the host of the profile's baseUrl
 *     (the base URL is the trust anchor the user confirms; an index that says
 *     something else would be confirming the wrong thing)
 *   - the auth scheme is one the app implements
 *   - NO PROFILE CONTAINS A KEY, ever
 *   - every endpoint has a method the app can send and a path that appends
 *
 *   node validate.mjs
 */

import fs from 'node:fs';
import path from 'node:path';

// Kept in step with ConnectorAuthScheme in the app
// (apps/web/src/lib/api-connectors-types.ts).
const SCHEMES = new Set(['bearer', 'apiKeyHeader', 'queryParam', 'basic', 'oauth2ClientCredentials']);
const METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);

const problems = [];
const fail = (m) => problems.push(m);

const index = JSON.parse(fs.readFileSync('index.json', 'utf-8'));
if (index.schemaVersion !== 1) fail(`index.json schemaVersion is ${index.schemaVersion}, expected 1`);

const listed = new Set();
for (const entry of index.connectors || []) {
    if (listed.has(entry.id)) fail(`index.json lists "${entry.id}" twice`);
    listed.add(entry.id);

    if (!fs.existsSync(entry.file)) { fail(`${entry.id}: ${entry.file} does not exist`); continue; }

    let p;
    try { p = JSON.parse(fs.readFileSync(entry.file, 'utf-8')); }
    catch (e) { fail(`${entry.id}: ${entry.file} is not valid JSON (${e.message})`); continue; }

    if (p.id !== entry.id) fail(`${entry.id}: the profile calls itself "${p.id}"`);
    if (path.basename(entry.file, '.json') !== p.id) fail(`${p.id}: the filename must be the id`);
    for (const req of ['id', 'name', 'baseUrl', 'auth']) {
        if (!p[req]) fail(`${entry.id}: missing required field "${req}"`);
    }
    if (!p.baseUrl) continue;

    let host;
    try { host = new URL(p.baseUrl).host; }
    catch { fail(`${entry.id}: baseUrl "${p.baseUrl}" is not a URL`); continue; }
    if (host !== entry.domain) {
        fail(`${entry.id}: index says domain "${entry.domain}", baseUrl points at "${host}" - the user confirms the domain, so these must agree`);
    }
    if (!/^https:/.test(p.baseUrl)) fail(`${entry.id}: baseUrl must be https`);

    const auth = p.auth || {};
    if (!SCHEMES.has(auth.scheme)) fail(`${entry.id}: auth scheme "${auth.scheme}" is not one the app implements (${[...SCHEMES].join(', ')})`);
    if (auth.scheme === 'apiKeyHeader' && !auth.headerName) fail(`${entry.id}: apiKeyHeader needs a headerName`);
    if (auth.scheme === 'queryParam' && !auth.queryParam) fail(`${entry.id}: queryParam needs a queryParam name`);
    // The one rule this library exists to keep.
    if ('key' in auth) fail(`${entry.id}: THE PROFILE CONTAINS A KEY. Profiles are keyless templates.`);
    for (const secretish of ['token', 'secret', 'apiKey', 'password']) {
        if (secretish in auth) fail(`${entry.id}: auth carries a "${secretish}" field - profiles are keyless`);
    }

    if (!Array.isArray(p.endpoints) || p.endpoints.length === 0) fail(`${entry.id}: no endpoints`);
    for (const e of p.endpoints || []) {
        if (!METHODS.has(e.method)) fail(`${entry.id}: endpoint method "${e.method}" is not supported`);
        if (typeof e.path !== 'string' || !e.path.startsWith('/')) fail(`${entry.id}: endpoint path "${e.path}" must start with /`);
        if (!e.summary) fail(`${entry.id} ${e.method} ${e.path}: no summary - the agent picks an endpoint by reading these`);
        for (const param of e.params || []) {
            if (!['query', 'path', 'body'].includes(param.in)) fail(`${entry.id} ${e.path}: param "${param.name}" has in="${param.in}"`);
        }
    }
    if (!p.docsDigest) fail(`${entry.id}: no docsDigest - the agent reads it to know how the API behaves`);
}

// The other direction: a profile nobody lists is a profile nobody can find.
for (const f of fs.readdirSync('profiles').filter(f => f.endsWith('.json'))) {
    const id = path.basename(f, '.json');
    if (!listed.has(id)) fail(`profiles/${f} exists but index.json does not list it`);
}

if (problems.length) {
    console.error('[validate] FAILED:');
    for (const p of problems) console.error('  - ' + p);
    process.exit(1);
}
console.log(`[validate] OK - ${listed.size} connectors, all keyless, all domains matching their base URL.`);
