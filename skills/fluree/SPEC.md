# Fluree Skill Specification

## Intent

Provide accurate, idiomatic guidance for using Fluree DB v4 via its CLI. Cover the full surface area: ledger management, data writing (Turtle/JSON-LD), querying (SPARQL/JSON-LD Query), branching, time travel, server management, and remote sync. Help the agent produce correct commands, data, and queries on the first attempt.

## Scope

In scope:
- All `fluree` CLI commands and flags
- Turtle and JSON-LD data formats for transactions
- SPARQL and JSON-LD Query syntax
- Branching, merging, rebasing workflows
- Time travel queries
- Project structure (`.fluree/` directory)
- Server management (`fluree server`)
- Remote sync (`fetch`, `pull`, `push`, `clone`)
- Prefix management, config, and indexing
- Common error diagnosis

Out of scope:
- Fluree HTTP API server implementation details (use the API docs directly)
- Rust library embedding (use the Rust API docs)
- Apache Iceberg / R2RML integration internals
- SHACL validation rule authoring (covered in Fluree security docs)
- General RDF/SPARQL tutorials (assume basic familiarity or point to Fluree docs)

## Users And Trigger Context

- Primary users: developers using the Fluree CLI to manage graph databases
- Common requests: create ledgers, insert/query data, branch/merge, time travel, troubleshoot errors
- Should not trigger for: generic SPARQL questions unrelated to Fluree, general RDF ontology design, non-Fluree graph databases

## Runtime Contract

- Required first actions: identify which CLI command or data format the user needs
- Required outputs: correct `fluree` commands, properly formatted data/query strings
- Non-negotiable constraints: use correct IRI syntax, respect auto-detection rules, prefer `upsert` over `insert` for idempotent operations
- Expected bundled references: `cli-commands.md`, `data-formats.md`, `query-patterns.md`, `transactions.md`, `branching.md`, `troubleshooting.md`

## Source And Evidence Model

Authoritative sources:
- Fluree DB v4 documentation at https://labs.flur.ee/docs/db
- Fluree CLI help output (`fluree --help`, `fluree <command> --help`)

Useful improvement sources:
- positive examples: real Fluree projects and working commands
- negative examples: malformed Turtle, incorrect SPARQL, failed transactions
- Fluree GitHub issues and changelogs

Data that must not be stored:
- secrets, API keys, credentials
- private ledger data

## Reference Architecture

- `SKILL.md`: router with core workflow, key concepts, common patterns, and reference routing table
- `references/cli-commands.md`: full CLI command syntax and flags
- `references/data-formats.md`: Turtle and JSON-LD format details, IRI conventions
- `references/query-patterns.md`: SPARQL and JSON-LD query examples and patterns
- `references/transactions.md`: insert, upsert, update, retraction patterns
- `references/branching.md`: branch lifecycle, merge, rebase, diff
- `references/troubleshooting.md`: common errors and fixes
- `references/graph-design.md`: graph schema design principles, anti-patterns, and Fluree-specific best practices (adapted from graph engineering principles)

## Validation

- Lightweight: structural check via `quick_validate.py`
- Deeper: verify commands against `fluree --help` output when possible

## Known Limitations

- Fluree v4 is actively developed; some CLI flags may change between versions
- SPARQL UPDATE requires a running server (not direct local mode)
- Remote-specific behaviors (tracked ledgers, `--at` translation) may evolve

## Maintenance Notes

- Update `SKILL.md` when new CLI commands are added or core workflow changes
- Update `references/` when command flags, format rules, or query patterns change
- Update `SOURCES.md` when new documentation pages become available
