---
name: fluree
description: "Assist with Fluree DB v4 CLI operations, data modeling, queries, transactions, and graph schema design. Use when working with fluree commands, writing Turtle or JSON-LD data, composing SPARQL or JSON-LD queries, managing ledgers and branches, troubleshooting Fluree errors, or designing knowledge graph structure. Also use when the user mentions RDF triples, IRIs, named graphs, time travel queries, entity resolution, graph anti-patterns, cardinality, or the .fluree/ project directory."
---

# Fluree DB v4

Fluree is a temporal graph database storing RDF triples with built-in time travel, full-text search (BM25), vector search, policy enforcement, and cryptographic verification. The CLI (`fluree`) operates directly on local ledgers without requiring a server.

## Live Docs First

Fluree DB v4 is actively changing. Treat the bundled references as quick guidance, but check the live docs whenever command syntax, flags, APIs, or behavior matter:

- Fluree DB docs: https://labs.flur.ee/docs/db
- CLI reference: https://labs.flur.ee/docs/db/cli
- `fluree init`: https://labs.flur.ee/docs/db/cli/init

Prefer the live docs and local `fluree --help` / `fluree <command> --help` output over stale examples in this skill.

## Project Structure

After `fluree init`, the `.fluree/` directory contains:

| File | Purpose |
|------|---------|
| `active` | Currently active ledger name |
| `config.toml` | Configuration settings |
| `prefixes.json` | IRI prefix mappings for compact IRIs |
| `storage/` | Ledger data |

## Core Workflow

1. `fluree init` - initialize project (idempotent)
2. `fluree create <ledger>` - create a ledger (sets it active)
3. `fluree insert` / `fluree upsert` / `fluree update` - write data
4. `fluree query` - query data (SPARQL or JSON-LD)
5. `fluree use <ledger>` - switch active ledger

## Input Resolution

Commands accepting data (`insert`, `upsert`, `update`, `query`) resolve input in this priority:

1. `-e` flag (inline expression)
2. Positional inline (auto-detected as data/query vs ledger name)
3. `-f` flag (file)
4. Positional file path
5. stdin

## Data Format Auto-Detection

| Signal | Format |
|--------|--------|
| Lines starting with `@prefix` or `@base` | Turtle |
| Content starting with `{` or `[` | JSON-LD |
| `.ttl` extension | Turtle |
| `.json` / `.jsonld` extension | JSON-LD |

Override with `--format turtle` or `--format jsonld`.

## Choosing the Right Write Command

| Command | Use when |
|---------|----------|
| `insert` | Adding new data; may create duplicates for existing subjects |
| `upsert` | Idempotent write; replaces values for supplied predicates on matching `@id` |
| `update` | Conditional WHERE/DELETE/INSERT; deleting specific triples; computed updates |

## Key Concepts

- **Ledger**: A database. Named as `mydb:main` (ledger:branch).
- **Branch**: Git-like isolation. Create with `fluree branch create <name>`.
- **Time travel**: Query any historical state with `--at <t|commit|ISO-8601>`.
- **IRIs**: All identifiers are IRIs. Use prefixes from `prefixes.json` for compact form.
- **Named graphs**: Data partitioned across graphs within a ledger.
- **Flakes**: Individual RDF triples stored in the database.

## Reference Routing

| I need to... | Read |
|--------------|------|
| verify current Fluree behavior, command syntax, or new docs | https://labs.flur.ee/docs/db and `references/cli-commands.md` |
| look up CLI command syntax, flags, or subcommands | `references/cli-commands.md` |
| write Turtle or JSON-LD data correctly | `references/data-formats.md` |
| compose SPARQL or JSON-LD queries | `references/query-patterns.md` |
| perform insert, upsert, update, or retraction transactions | `references/transactions.md` |
| create, merge, rebase, or diff branches | `references/branching.md` |
| diagnose a Fluree error or unexpected behavior | `references/troubleshooting.md` |
| design graph schemas, avoid anti-patterns, or model relationships well | `references/graph-design.md` |
| set up BM25 full-text search with `@fulltext` or `f:fullTextDefaults` | `references/fulltext-search.md` |
| format query results for LLM/agent consumption | `references/agent-json.md` |

## Common Patterns

### Quick start

```bash
fluree init
fluree create mydb
fluree insert '@prefix ex: <http://example.org/> .
ex:alice a ex:Person ; ex:name "Alice" .'
fluree query 'SELECT ?name WHERE { ?s <http://example.org/name> ?name }'
```

### Time travel

```bash
fluree query --at 3 'SELECT * WHERE { ?s ?p ?o }'
fluree query --at 2024-01-15T10:30:00Z 'SELECT * WHERE { ?s ?p ?o }'
```

### Branching

```bash
fluree branch create dev
fluree use mydb:dev
fluree insert '@prefix ex: <http://example.org/> . ex:bob ex:name "Bob" .'
fluree branch merge dev
```

### Bulk import

```bash
fluree create mydb --from seed-data.ttl
fluree create mydb --from large.ttl --memory-budget-mb 4096 --parallelism 8
```

## Docs

Fluree changes quickly. Check the current docs before relying on command or API details:

- Full documentation: https://labs.flur.ee/docs/db
- CLI reference: https://labs.flur.ee/docs/db/cli
- `fluree init`: https://labs.flur.ee/docs/db/cli/init
