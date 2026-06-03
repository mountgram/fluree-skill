# Data Formats

Official docs to verify current format behavior: https://labs.flur.ee/docs/db/transactions and https://labs.flur.ee/docs/db/query

## Turtle

### Basic syntax

```turtle
@prefix ex: <http://example.org/> .
@prefix schema: <http://schema.org/> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

ex:alice a schema:Person ;
    schema:name "Alice" ;
    schema:age 30 ;
    schema:email "alice@example.org" .
```

### Key rules

- Statements end with `.`
- `;` separates predicate-object pairs for the same subject
- `,` separates multiple objects for the same predicate
- `a` is shorthand for `rdf:type`
- Strings are quoted: `"value"` or `"value"@en` for language-tagged
- Typed literals: `"1990-05-15"^^xsd:date`
- Blank nodes: `_:b1` or `[ schema:name "Anonymous" ]`

### Multi-entity example

```turtle
@prefix ex: <http://example.org/> .

ex:alice a ex:Person ;
    ex:name "Alice" ;
    ex:worksFor ex:acme .

ex:acme a ex:Organization ;
    ex:name "Acme Corp" .
```

## JSON-LD

### Basic syntax

```json
{
  "@context": {
    "ex": "http://example.org/",
    "schema": "http://schema.org/"
  },
  "@id": "ex:alice",
  "@type": "schema:Person",
  "schema:name": "Alice",
  "schema:age": 30
}
```

### Multiple entities with @graph

```json
{
  "@context": {
    "ex": "http://example.org/",
    "schema": "http://schema.org/"
  },
  "@graph": [
    {
      "@id": "ex:alice",
      "@type": "schema:Person",
      "schema:name": "Alice",
      "schema:worksFor": { "@id": "ex:acme" }
    },
    {
      "@id": "ex:acme",
      "@type": "schema:Organization",
      "schema:name": "Acme Corp"
    }
  ]
}
```

### Key rules

- `@id` identifies the subject (IRI)
- `@type` sets `rdf:type`
- `@context` defines prefix mappings
- `@graph` wraps multiple entities
- References use `{ "@id": "ex:something" }`
- Typed values: `{ "@value": "1990-05-15", "@type": "xsd:date" }`
- Language tags: `{ "@value": "hello", "@language": "en" }`

## IRIs

All identifiers in Fluree are IRIs. Compact forms use prefixes:

| Compact | Expanded |
|---------|----------|
| `ex:alice` | `http://example.org/alice` |
| `schema:name` | `http://schema.org/name` |
| `xsd:date` | `http://www.w3.org/2001/XMLSchema#date` |

Manage prefixes with `fluree prefix add <prefix> <iri>`.

## Common XSD Datatypes

| Type | IRI | Example |
|------|-----|---------|
| string | `xsd:string` | `"hello"` |
| integer | `xsd:integer` | `42` |
| decimal | `xsd:decimal` | `3.14` |
| boolean | `xsd:boolean` | `true` |
| date | `xsd:date` | `"2024-01-15"^^xsd:date` |
| dateTime | `xsd:dateTime` | `"2024-01-15T10:30:00Z"^^xsd:dateTime` |

In JSON-LD, numbers and booleans are auto-typed. Dates require explicit `@type`.

## Named Graphs

Data can be partitioned into named graphs:

### Turtle (TriG)

```turtle
@prefix ex: <http://example.org/> .

ex:graph1 {
    ex:alice ex:name "Alice" .
}

ex:graph2 {
    ex:bob ex:name "Bob" .
}
```

### JSON-LD

```json
{
  "@context": { "ex": "http://example.org/" },
  "@graph": [
    {
      "@id": "ex:graph1",
      "@graph": [
        { "@id": "ex:alice", "ex:name": "Alice" }
      ]
    }
  ]
}
```
