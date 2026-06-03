# BM25 Full-Text Search

Fluree supports inline BM25 full-text search via the `@fulltext` datatype (JSON-LD) or `f:fullText` typed literal (Turtle). No external services required.

## Quick Start: Per-Value Annotation (`@fulltext` datatype)

The simplest approach. Tag individual literal values. Zero config, always English.

### Turtle syntax

```turtle
@prefix ex: <http://example.org/> .
@prefix f: <https://ns.flur.ee/db#> .

ex:article a ex:Article ;
  ex:title "Introduction to Rust" ;
  ex:content "Rust is a systems programming language focused on safety"^^f:fullText .
```

The `^^f:fullText` typed literal is the Turtle/SPARQL equivalent of `"@type": "@fulltext"` in JSON-LD.

### JSON-LD syntax

```json
{
  "@id": "ex:article",
  "ex:content": {
    "@value": "Rust is a systems programming language focused on safety",
    "@type": "@fulltext"
  }
}
```

### Querying with `fulltext()`

```json
{
  "select": ["?title", "?score"],
  "where": [
    { "@id": "?doc", "ex:content": "?content", "ex:title": "?title" },
    ["bind", "?score", "(fulltext ?content \"Rust programming\")"],
    ["filter", "(> ?score 0)"]
  ],
  "orderBy": [["desc", "?score"]],
  "limit": 10
}
```

`fulltext()` returns a BM25 relevance score. Score 0 means no matching terms.

## Ledger-Level Configuration (`f:fullTextDefaults`)

For when every value of a property should be searchable, or when you need non-English languages.

### Config (Turtle/TriG)

```trig
@prefix f: <https://ns.flur.ee/db#> .
@prefix ex: <http://example.org/> .

GRAPH <urn:fluree:mydb:main#config> {
  <urn:fluree:mydb:main:config:ledger> a f:LedgerConfig ;
    f:fullTextDefaults [
      a f:FullTextDefaults ;
      f:defaultLanguage "en" ;
      f:property [ a f:FullTextProperty ; f:target ex:description ] ,
                 [ a f:FullTextProperty ; f:target ex:title ]
    ] .
}
```

After writing config, run `fluree reindex <ledger>` to index existing values.

### HTTP endpoint for config

```bash
curl -X POST 'http://localhost:8090/v1/fluree/update?ledger=mydb:main' \
  -H 'Content-Type: application/json' \
  -d '{
    "@context": {"f": "https://ns.flur.ee/db#", "ex": "http://example.org/"},
    "@graph": [{
      "@id": "urn:fluree:mydb:main:config:ledger",
      "@type": "f:LedgerConfig",
      "@graph": "urn:fluree:mydb:main#config",
      "f:fullTextDefaults": {
        "@type": "f:FullTextDefaults",
        "f:defaultLanguage": "en",
        "f:property": [
          {"@type": "f:FullTextProperty", "f:target": {"@id": "ex:description"}}
        ]
      }
    }]
  }'
```

## Scoring

BM25 (Best Match 25):
- **IDF** downweights common terms, boosts rare ones
- **Document length normalization** prevents long docs from dominating
- **Term frequency saturation** diminishing returns for repeated terms
- **English analysis**: tokenization, lowercasing, stopword removal, Snowball stemming

18 languages supported for configured indexes.

## Auto-Indexing

Fulltext arenas are built automatically during background binary index builds. Works immediately (no-index fallback) with optimal performance after indexing (~625K docs/sec indexed throughput).

## Mixed Paths

A single property can mix:
- `@fulltext` values → English arena
- `rdf:langString` "fr" → French arena
- Plain `xsd:string` → arena for configured `f:defaultLanguage`

## Performance

| Docs | Novetly (no index) | Indexed (BM25) | Speedup |
|------|-------------------|----------------|---------|
| 1,000 | 11.6 ms | 1.7 ms | 6.7x |
| 50,000 | 601.9 ms | 80.2 ms | 7.5x |

Indexed throughput: ~625,000 docs/sec. Near-linear scaling.
