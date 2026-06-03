# CLI Commands Reference

## Official Docs

Fluree DB v4 changes actively. Verify current command syntax, flags, and examples against the live CLI docs and local help before giving exact commands:

- CLI reference: https://labs.flur.ee/docs/db/cli
- `fluree init`: https://labs.flur.ee/docs/db/cli/init
- Full DB docs: https://labs.flur.ee/docs/db
- Local help: `fluree --help` and `fluree <command> --help`

## Global Options

| Flag | Description |
|------|-------------|
| `-v, --verbose` | Verbose output |
| `-q, --quiet` | Suppress non-essential output |
| `--no-color` | Disable colored output (also respects `NO_COLOR`) |
| `--config <PATH>` | Path to config file |
| `--memory-budget-mb <MB>` | Memory budget for bulk import (0 = auto: 75% RAM) |
| `--parallelism <N>` | Parallel parse threads for bulk import (0 = auto: cores, cap 6) |

## Core Commands

### init

```bash
fluree init [--global]
```

Creates `.fluree/` directory. Idempotent. `--global` uses platform dirs instead.

### create

```bash
fluree create <LEDGER> [--from <PATH>] [--memory [PATH]] [--no-user]
```

| Option | Description |
|--------|-------------|
| `--from <PATH>` | Import data from Turtle or JSON-LD file |
| `--memory [PATH]` | Import developer memory history from `.fluree-memory/` |
| `--no-user` | Exclude user-scoped memories from `--memory` |
| `--chunk-size-mb <MB>` | Chunk size for large Turtle files |
| `--leaflet-rows <N>` | Rows per leaflet (default: 25000) |
| `--leaflets-per-leaf <N>` | Leaflets per leaf (default: 10) |

Sets new ledger as active.

### use

```bash
fluree use <LEDGER>
```

Set active ledger. Accepts `name` or `name:branch`.

### list

```bash
fluree list
```

List all ledgers.

### info

```bash
fluree info [LEDGER]
```

Show detailed ledger information.

### drop

```bash
fluree drop <LEDGER>
```

Delete a ledger.

### graph

```bash
fluree graph list [LEDGER]
fluree graph drop <GRAPH> [LEDGER]
```

Manage named graphs within a ledger.

### insert

```bash
fluree insert [LEDGER] [DATA] [-e <EXPR>] [-f <FILE>] [-m <MSG>] [--format <FMT>] [--remote <NAME>]
```

Add new triples. May create duplicates for existing subjects.

### upsert

```bash
fluree upsert [LEDGER] [DATA] [-e <EXPR>] [-f <FILE>] [-m <MSG>] [--format <FMT>] [--remote <NAME>]
```

Insert or replace values for supplied predicates on matching `@id`. Idempotent.

### update

```bash
fluree update [LEDGER] [DATA] [-e <EXPR>] [-f <FILE>] [-m <MSG>] [--format <FMT>] [--remote <NAME>] [--direct]
```

Full WHERE/DELETE/INSERT semantics. Supports JSON-LD and SPARQL UPDATE. SPARQL UPDATE requires a running server (or `--remote`).

### query

```bash
fluree query [LEDGER] [QUERY] [-e <EXPR>] [-f <FILE>] [--format <FMT>] [--sparql] [--jsonld] [--at <TIME>] [--bench] [--explain] [--remote <NAME>] [--normalize-arrays]
```

| Option | Description |
|--------|-------------|
| `--format` | `json`, `typed-json`, `table`, `csv`, `tsv` (default: `table`) |
| `--at <TIME>` | Time travel: `t:N`, commit hash, or ISO-8601 |
| `--bench` | Benchmark mode: time + first 5 rows only |
| `--explain` | Print query plan without executing |
| `--normalize-arrays` | Always wrap multi-values in arrays (JSON-LD graph crawl) |

Format auto-detection: contains `SELECT`/`CONSTRUCT`/`ASK`/`DESCRIBE` = SPARQL, otherwise JSON-LD.

### history

```bash
fluree history [LEDGER] <IRI>
```

Show change history for an entity.

### export

```bash
fluree export [LEDGER] [--format <FMT>]
```

Export ledger data.

### log

```bash
fluree log [LEDGER]
```

Show commit log.

### show

```bash
fluree show [LEDGER] <COMMIT-REF>
```

Show decoded commit contents (flakes with resolved IRIs).

### index

```bash
fluree index [LEDGER]
```

Build or update binary index (incremental).

### reindex

```bash
fluree reindex [LEDGER]
```

Full reindex from commit history.

### config

```bash
fluree config get <KEY>
fluree config set <KEY> <VALUE>
fluree config list
```

### prefix

```bash
fluree prefix list
fluree prefix add <PREFIX> <IRI>
fluree prefix remove <PREFIX>
```

Manage IRI prefix mappings in `prefixes.json`.

### context

```bash
fluree context [LEDGER]
```

Show or manage JSON-LD @context.

## Branch Commands

```bash
fluree branch create <NAME> [--ledger <L>] [--from <BRANCH>] [--at <REF>] [--remote <R>]
fluree branch list [LEDGER] [--remote <R>]
fluree branch drop <NAME> [--ledger <L>] [--remote <R>]
fluree branch rebase <NAME> [--ledger <L>] [--strategy <S>] [--remote <R>]
fluree branch diff <SOURCE> [--target <BRANCH>] [--json] [--conflict-details] [--no-conflicts]
fluree branch merge <SOURCE> [--target <BRANCH>] [--strategy <S>] [--ledger <L>] [--remote <R>]
```

Strategies: `take-both` (default), `abort`, `take-source`, `take-branch`, `skip`.

## Remote Sync Commands

```bash
fluree remote add <NAME> <URL>
fluree remote remove <NAME>
fluree remote list
fluree upstream set <BRANCH> [--remote <R>] [--branch <REMOTE-BRANCH>]
fluree upstream show [BRANCH]
fluree fetch [REMOTE]
fluree clone <REMOTE-URL> [LOCAL-NAME]
fluree pull [BRANCH] [--remote <R>]
fluree push [BRANCH] [--remote <R>]
fluree track <REMOTE-LEDGER> [--remote <R>]
```

Clone and pull transfer commits and binary index data by default. Use `--no-indexes` to skip.

## Server Commands

```bash
fluree server run          # Run in foreground
fluree server start        # Start as background daemon
fluree server stop         # Stop daemon
fluree server status       # Check if running
fluree server restart      # Restart daemon
fluree server logs         # Tail daemon logs
```

Server inherits `.fluree/` context from the project directory.

## Auth Commands

```bash
fluree token create [--subject <SUB>] [--expiry <DUR>]
fluree token inspect <TOKEN>
fluree auth login [--remote <R>]
fluree auth logout [--remote <R>]
fluree auth status [--remote <R>]
```

## Developer Memory

```bash
fluree memory store <CATEGORY> <CONTENT>
fluree memory recall [CATEGORY]
fluree memory list
fluree memory delete <ID>
```

## MCP Server

```bash
fluree mcp
```

Start MCP server for IDE agent integration.

## Other

```bash
fluree iceberg             # Apache Iceberg integration
fluree publish             # Publish a ledger
fluree completions <SHELL> # Generate shell completions (bash, zsh, fish)
```
