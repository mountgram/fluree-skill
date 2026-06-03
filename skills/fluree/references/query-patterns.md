# Query Patterns

Official docs to verify current query behavior: https://labs.flur.ee/docs/db/query

## SPARQL Queries

### Basic SELECT

```sparql
PREFIX ex: <http://example.org/>

SELECT ?name ?age
WHERE {
  ?person a ex:Person ;
          ex:name ?name ;
          ex:age ?age .
}
```

### Filter

```sparql
PREFIX ex: <http://example.org/>

SELECT ?name
WHERE {
  ?person ex:name ?name ;
          ex:age ?age .
  FILTER(?age > 25)
}
```

### OPTIONAL

```sparql
PREFIX ex: <http://example.org/>

SELECT ?name ?email
WHERE {
  ?person ex:name ?name .
  OPTIONAL { ?person ex:email ?email }
}
```

### COUNT / GROUP BY

```sparql
PREFIX ex: <http://example.org/>

SELECT ?type (COUNT(?s) AS ?count)
WHERE {
  ?s a ?type .
}
GROUP BY ?type
ORDER BY DESC(?count)
```

### CONSTRUCT

```sparql
PREFIX ex: <http://example.org/>
PREFIX schema: <http://schema.org/>

CONSTRUCT {
  ?person schema:name ?name .
}
WHERE {
  ?person ex:name ?name .
}
```

### ASK

```sparql
PREFIX ex: <http://example.org/>

ASK {
  ex:alice ex:name "Alice" .
}
```

### Subquery

```sparql
PREFIX ex: <http://example.org/>

SELECT ?name ?age
WHERE {
  ?person ex:name ?name ;
          ex:age ?age .
  {
    SELECT ?person WHERE {
      ?person a ex:Person .
    }
    LIMIT 10
  }
}
```

### UNION

```sparql
PREFIX ex: <http://example.org/>

SELECT ?name
WHERE {
  { ?person ex:firstName ?name }
  UNION
  { ?person ex:name ?name }
}
```

## JSON-LD Queries

### Basic select

```json
{
  "@context": { "ex": "http://example.org/" },
  "select": ["?name", "?age"],
  "where": [
    { "@id": "?person", "ex:name": "?name", "ex:age": "?age" }
  ]
}
```

### Filter

```json
{
  "@context": { "ex": "http://example.org/" },
  "select": ["?name"],
  "where": [
    { "@id": "?person", "ex:name": "?name", "ex:age": "?age" }
  ],
  "filter": [
    { ">:": ["?age", 25] }
  ]
}
```

### Graph crawl (get entity with related data)

```json
{
  "@context": { "ex": "http://example.org/" },
  "select": {
    "?person": ["ex:name", "ex:age", { "ex:worksFor": ["ex:name"] }]
  },
  "where": [
    { "@id": "?person", "@type": "ex:Person" }
  ]
}
```

### Select all properties

```json
{
  "@context": { "ex": "http://example.org/" },
  "select": { "?person": ["*"] },
  "where": [
    { "@id": "?person", "@type": "ex:Person" }
  ]
}
```

## Time Travel Queries

### SPARQL with --at flag

```bash
fluree query --at 5 'SELECT * WHERE { ?s ?p ?o }'
fluree query --at 2024-01-15T10:30:00Z 'SELECT * WHERE { ?s ?p ?o }'
fluree query --at bafybeig... 'SELECT * WHERE { ?s ?p ?o }'
```

### JSON-LD with from

```json
{
  "@context": { "ex": "http://example.org/" },
  "from": "mydb:main@t:5",
  "select": ["?name"],
  "where": [
    { "@id": "?person", "ex:name": "?name" }
  ]
}
```

### SPARQL with FROM IRI

```sparql
SELECT ?name
FROM <mydb:main@t:5>
WHERE {
  ?person <http://example.org/name> ?name .
}
```

## Output Formats

| Format | Flag | Use case |
|--------|------|----------|
| table | `--format table` | Human-readable (default) |
| json | `--format json` | Standard SPARQL JSON results |
| typed-json | `--format typed-json` | Preserves datatype info |
| csv | `--format csv` | Spreadsheet import (local only) |
| tsv | `--format tsv` | Tab-separated (local only) |

## Query Performance Tips

- Use `LIMIT` for large result sets
- Use `--explain` to inspect query plans before running expensive queries
- Prefer `@t:` (transaction number) for time travel when known (most efficient)
- Structure queries to leverage indexes (SPOT, POST, OPST, PSOT)
- Bind variables early in WHERE patterns to narrow subsequent lookups
