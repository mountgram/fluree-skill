# Graph Design Principles for Fluree

Adapted from graph engineering best practices for Fluree's RDF triple store model.

## Core Principles

1. **Sparse graphs scale** - over-connecting is worse than under-connecting
2. **Bound predicate cardinality** - no subject with 100K+ values for one predicate
3. **Time travel is free** - Fluree preserves all history; design for temporal queries from day one
4. **Entity resolution first** - same IRI = same entity; resolve before inserting
5. **Profile with `--explain`** - inspect query plans before running expensive queries

## Patterns

### Bounded Predicate Cardinality

Design schemas with explicit cardinality budgets per subject type.

| Subject Type | Max values per predicate | Strategy |
|-------------|--------------------------|----------|
| Person | 1000 | Aggregate after threshold |
| Event | 100 | Prune low-value links |
| Entity | 500 | Partition by time window using named graphs |
| Concept | 10000 | Use hierarchical `skos:broader` chains |

Detect hot subjects:

```sparql
SELECT ?subject (COUNT(?o) AS ?count)
WHERE { ?subject ?p ?o }
GROUP BY ?subject
HAVING (COUNT(?o) > 10000)
ORDER BY DESC(?count)
LIMIT 20
```

**Fix**: partition by time (named graphs per quarter), aggregate counts as literal values, or use hierarchical bucketing.

### Temporal Design (Fluree Advantage)

Fluree preserves every transaction. Unlike property graphs where you must add `valid_from`/`valid_until` to every edge, Fluree gives you time travel natively.

```bash
# Query current state
fluree query 'SELECT ?name WHERE { ex:alice ex:name ?name }'

# Query state at transaction 5
fluree query --at 5 'SELECT ?name WHERE { ex:alice ex:name ?name }'

# Query state at a timestamp
fluree query --at 2024-01-15T10:30:00Z 'SELECT ?name WHERE { ex:alice ex:name ?name }'
```

**Design implication**: don't add manual `valid_from`/`valid_until` properties. Use `--at` for historical queries. Use `fluree log` and `fluree history <IRI>` for audit trails.

When you do need explicit temporal metadata (e.g., "this belief was held from date X to date Y as a domain fact, not just a transaction time"), model it as triples:

```turtle
ex:alice ex:believes [
    ex:target ex:flatEarth ;
    ex:from "2020-01-01"^^xsd:date ;
    ex:until "2023-06-15"^^xsd:date ;
    ex:confidence 0.3
] .
```

### Entity Resolution via IRI Identity

In Fluree, entity resolution is IRI-based: same IRI = same entity. The critical work is choosing canonical IRIs before inserting data.

```bash
# WRONG: creates separate entities
fluree insert '@prefix ex: <http://example.org/> .
ex:john-smith ex:name "John Smith" .
ex:j-smith ex:name "J. Smith" .'

# RIGHT: resolve to canonical IRI first
fluree upsert '@prefix ex: <http://example.org/> .
ex:person-john-smith ex:name "John Smith" ;
    ex:alsoKnownAs "J. Smith", "John S." .'
```

Use `upsert` (not `insert`) for idempotent entity syncs. Design IRIs to be deterministic: `ex:person-{normalized-name}` or `ex:user-{uuid}`.

### Index-Aware Query Design

Fluree auto-selects indexes (SPOT, POST, OPST, PSOT) based on which triple components are bound. Design queries to bind variables early:

```sparql
# GOOD: subject bound first, then predicate lookup
SELECT ?name WHERE {
  ex:alice ex:name ?name .
  ex:alice ex:age ?age .
}

# GOOD: type bound narrows scan
SELECT ?person ?name WHERE {
  ?person a ex:Person ;
          ex:name ?name .
}

# BAD: unbound triple pattern scans everything
SELECT ?s WHERE {
  ?s ?p ?o .
  FILTER(?o = "Alice")
}
```

Use `--explain` to verify index selection:

```bash
fluree query --explain 'SELECT ?name WHERE { ?person a ex:Person ; ex:name ?name }'
```

### Causal Relationships as DAGs

Model cause-effect with explicit direction and metadata. Validate acyclicity in application code before inserting.

```turtle
@prefix ex: <http://example.org/> .

ex:rain ex:causes ex:wetStreets ;
    ex:causalStrength 0.9 ;
    ex:evidenceCount 42 .
```

## Anti-Patterns

### God Subjects

**Problem**: A subject with hundreds of thousands of triples for one predicate. Every query touching it scans all values.

**Symptoms**: queries timeout on specific subjects; performance degrades as data grows.

**Fix**:
- Partition by time: use named graphs per period (`ex:events-2024-q1`)
- Aggregate: store counts as literals instead of individual triples
- Hierarchical: bucket via intermediate nodes

### Unbounded Property Paths

**Problem**: SPARQL property paths like `ex:knows*` without depth limits. Graph traversal is exponential.

```sparql
# BAD: unbounded
SELECT ?friend WHERE { ex:alice ex:knows* ?friend }

# GOOD: bounded depth
SELECT ?friend WHERE { ex:alice ex:knows{1,3} ?friend }
```

### Cartesian Products in SPARQL

**Problem**: Multiple graph patterns without shared variables create cross-joins.

```sparql
# BAD: Cartesian product (1000 x 1000 = 1M rows)
SELECT ?person ?event WHERE {
  ?person a ex:Person .
  ?event a ex:Event .
}

# GOOD: connected pattern
SELECT ?person ?event WHERE {
  ?person a ex:Person ;
          ex:attended ?event .
}

# GOOD: use subquery to limit scope
SELECT ?person ?event WHERE {
  { SELECT ?person WHERE { ?person a ex:Person } LIMIT 100 }
  ?person ex:attended ?event .
}
```

### Large Literal Blobs

**Problem**: Storing large JSON strings, base64 data, or embedding vectors as literal values in triples. Slows node loading and bloats storage.

**Fix**: Store a reference IRI to external storage. For vectors, use Fluree's native vector search graph sources instead of storing embeddings as literals.

### Hard Deletion

**Problem**: Using retractions to permanently remove data loses history.

**Fluree advantage**: retractions are recorded as new transactions. Historical state is always queryable via `--at`. But if you need domain-level "this was explicitly revoked" semantics, model it:

```turtle
ex:alice ex:status "revoked" ;
    ex:revokedAt "2024-06-01"^^xsd:date ;
    ex:revokedBy ex:admin .
```

### Skipping `--explain` on Complex Queries

**Problem**: SPARQL hides complexity. A query that looks simple may trigger full scans.

**Fix**: Always run `--explain` before deploying complex queries. Use `--bench` to measure actual execution time.

## Design Checklist

- [ ] IRIs are deterministic and canonical (entity resolution done)
- [ ] No subject expected to exceed 10K values for a single predicate
- [ ] Time travel queries tested with `--at`
- [ ] SPARQL property paths bounded (`{1,N}` not `*`)
- [ ] No Cartesian products (all graph patterns share variables)
- [ ] Large data stored externally, referenced by IRI
- [ ] `--explain` reviewed for key queries
- [ ] Named graphs used for data partitioning where appropriate
