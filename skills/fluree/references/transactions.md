# Transaction Patterns

Official docs to verify current transaction behavior: https://labs.flur.ee/docs/db/transactions

## Insert

Add new triples. Does not check for existing data.

### Turtle

```bash
fluree insert '@prefix ex: <http://example.org/> .
ex:alice a ex:Person ;
    ex:name "Alice" ;
    ex:age 30 .'
```

### JSON-LD

```bash
fluree insert '{
  "@context": {"ex": "http://example.org/"},
  "@id": "ex:alice",
  "@type": "ex:Person",
  "ex:name": "Alice",
  "ex:age": 30
}'
```

### Batch insert (multiple entities)

```bash
fluree insert '{
  "@context": {"ex": "http://example.org/"},
  "@graph": [
    {"@id": "ex:alice", "@type": "ex:Person", "ex:name": "Alice"},
    {"@id": "ex:bob", "@type": "ex:Person", "ex:name": "Bob"}
  ]
}'
```

### With commit message

```bash
fluree insert -f data.ttl -m "Added initial users"
```

## Upsert

Idempotent: inserts new entities, replaces values for supplied predicates on existing entities (matched by `@id`).

### Turtle

```bash
fluree upsert '@prefix ex: <http://example.org/> .
ex:alice ex:name "Alice Smith" ;
    ex:age 31 .'
```

If `ex:alice` exists, her `ex:name` and `ex:age` are replaced. Other predicates (e.g., `ex:email`) are untouched.

### JSON-LD

```bash
fluree upsert '{
  "@context": {"ex": "http://example.org/"},
  "@id": "ex:alice",
  "ex:name": "Alice Smith",
  "ex:age": 31
}'
```

### When to use upsert vs insert

| Scenario | Command |
|----------|---------|
| First-time data load | `insert` |
| Syncing from external source | `upsert` |
| Updating known entity properties | `upsert` |
| Adding additional triples to existing entity | `insert` |
| Idempotent re-runs | `upsert` |

## Update (WHERE/DELETE/INSERT)

Conditional updates with full pattern matching.

### Conditional property update

```bash
fluree update '{
  "@context": {"ex": "http://example.org/"},
  "where": [{"@id": "ex:alice", "ex:age": "?oldAge"}],
  "delete": [{"@id": "ex:alice", "ex:age": "?oldAge"}],
  "insert": [{"@id": "ex:alice", "ex:age": 31}]
}'
```

### Delete specific triples

```bash
fluree update '{
  "@context": {"ex": "http://example.org/"},
  "where": [{"@id": "ex:alice", "ex:email": "?email"}],
  "delete": [{"@id": "ex:alice", "ex:email": "?email"}]
}'
```

### Bulk conditional update

```bash
fluree update '{
  "@context": {"ex": "http://example.org/"},
  "where": [{"@id": "?person", "ex:status": "pending"}],
  "delete": [{"@id": "?person", "ex:status": "pending"}],
  "insert": [{"@id": "?person", "ex:status": "active"}]
}'
```

### SPARQL UPDATE (requires server)

```bash
fluree update -e 'PREFIX ex: <http://example.org/>
DELETE { ex:alice ex:age ?oldAge }
INSERT { ex:alice ex:age 31 }
WHERE { ex:alice ex:age ?oldAge }'
```

### Computed update with bind

```bash
fluree update '{
  "@context": {"ex": "http://example.org/"},
  "where": [
    {"@id": "?person", "ex:salary": "?salary"}
  ],
  "delete": [{"@id": "?person", "ex:salary": "?salary"}],
  "insert": [{"@id": "?person", "ex:salary": "?newSalary"}],
  "bind": {"?newSalary": {"*:": ["?salary", 1.1]}}
}'
```

## Retractions

Remove specific triples using `update` with WHERE + DELETE:

```bash
fluree update '{
  "@context": {"ex": "http://example.org/"},
  "where": [{"@id": "ex:alice", "ex:phone": "?phone"}],
  "delete": [{"@id": "ex:alice", "ex:phone": "?phone"}]
}'
```

## Transaction Output

```
Committed t=1 (42 flakes)
```

With `-v`:
```
Committed t=1 (42 flakes)
Commit ID: bafybeig...
```

## Best Practices

1. Use `upsert` for idempotent operations (syncs, re-runs)
2. Use `insert` when adding new triples without replacing existing ones
3. Use `update` for conditional logic, deletions, or computed values
4. Batch related entities in a single transaction using `@graph`
5. Always include `@type` for entities
6. Use meaningful IRIs (e.g., `ex:user-alice-123`, not `ex:1`)
7. Add commit messages with `-m` for auditability
