# Agent JSON Format

Official docs to verify current HTTP API and output format behavior: https://labs.flur.ee/docs/db/api and https://labs.flur.ee/docs/db/query

Fluree supports `application/vnd.fluree.agent+json` — a query output format optimized for LLM/agent consumption.

## Request

Set the `Accept` header on any Fluree query:

```bash
curl -X POST http://localhost:8090/v1/fluree/query \
  -H "Content-Type: application/sparql-query" \
  -H "Accept: application/vnd.fluree.agent+json" \
  -H "Fluree-Max-Bytes: 32768" \
  -d 'SELECT ?s ?name ?type WHERE { ?s ex:name ?name . OPTIONAL { ?s a ?type } }'
```

## Response Envelope

```json
{
  "schema": { "?name": "xsd:string", "?age": "xsd:integer", "?s": "uri" },
  "rows": [
    {"?name": "Alice", "?age": 30, "?s": "ex:alice"},
    {"?name": "Bob", "?age": 25, "?s": "ex:bob"}
  ],
  "rowCount": 2,
  "t": 5,
  "iso": "2026-03-26T14:30:00Z",
  "hasMore": false
}
```

## Key Features

- **Schema-once** — datatypes declared once per variable, not repeated per value
- **Native JSON types** — strings, numbers, booleans without `@value`/`@type` wrappers for inferable types
- **Pagination** — byte-budget truncation via `Fluree-Max-Bytes` header, with `hasMore` flag and auto-generated `resume` SPARQL query
- **Time-pinning** — `t` (transaction number) and `iso` (wallclock timestamp) for reproducibility
- **Compact** — significantly fewer tokens than SPARQL JSON format

## Schema Types

| Type | Description |
|------|-------------|
| `xsd:string` | String literal |
| `xsd:integer` | Integer literal |
| `xsd:long` | Long integer |
| `xsd:double` | Double-precision float |
| `xsd:boolean` | Boolean |
| `xsd:dateTime` | ISO-8601 datetime |
| `uri` | IRI reference |
| `["xsd:string", "xsd:integer"]` | Mixed types per variable |

## Truncation & Pagination

When response exceeds `Fluree-Max-Bytes`:

```json
{
  "hasMore": true,
  "message": "Response truncated due to size limit of 32768 bytes. Use the query below to retrieve the next batch.",
  "resume": "SELECT ?name ?age FROM <mydb:main@t:5> WHERE { ... } OFFSET 2 LIMIT 100"
}
```

The `resume` field contains a ready-to-execute SPARQL query with `@t:` time-pinning and correct `OFFSET`.

## Multi-Ledger

For cross-ledger queries, `t` is omitted and `resume` is not provided. Use `iso` for time-pinning.

## Comparison

| Format | Best for |
|--------|----------|
| SPARQL JSON | Standard tooling, interop |
| JSON-LD | Human-facing apps, compact |
| Typed JSON | Struct deserialization |
| **Agent JSON** | **LLM/agent consumers — fewer tokens, schema-first, pagination** |
