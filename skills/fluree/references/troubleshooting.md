# Troubleshooting

## Common Errors

### PARSE_ERROR - Invalid JSON-LD

**Symptom:** Transaction rejected with parse error.

**Causes:**
- Missing `@context` in JSON-LD
- Malformed JSON (trailing commas, unquoted keys)
- Invalid `@id` value (must be a string IRI)

**Fix:** Validate JSON with a linter. Ensure `@context` is present and all `@id` values are strings.

### INVALID_IRI - Malformed IRI

**Symptom:** `INVALID_IRI` error on insert or query.

**Causes:**
- Prefix not defined in `prefixes.json` or `@context`
- Missing angle brackets on full IRIs in Turtle
- Empty or invalid IRI string

**Fix:**
- Check `fluree prefix list` for registered prefixes
- Add missing prefix: `fluree prefix add ex http://example.org/`
- In Turtle, use full IRIs with `<>` or ensure prefix is declared with `@prefix`

### TYPE_ERROR - Type mismatch

**Symptom:** `TYPE_ERROR` on transaction.

**Causes:**
- Inserting a string where a number is expected (or vice versa)
- Date values without explicit `xsd:date` type

**Fix:** Use typed literals explicitly:
```turtle
ex:alice ex:birthDate "1990-05-15"^^xsd:date .
```
```json
{"@value": "1990-05-15", "@type": "xsd:date"}
```

### POLICY_DENIED - Not authorized

**Symptom:** Query returns empty results or transaction is rejected.

**Causes:**
- Policy rules restrict access to certain data
- Missing authentication token

**Fix:** Check policies with the ledger admin. Use `fluree auth status` to verify authentication.

### No active ledger

**Symptom:** Commands fail with "no active ledger" or similar.

**Fix:**
```bash
fluree list              # see available ledgers
fluree use <ledger>      # set active ledger
fluree create <ledger>   # create new ledger
```

### Query returns no results

**Causes:**
- Wrong ledger or branch active
- IRIs don't match (prefix mismatch, trailing slash differences)
- Data not yet committed

**Debug steps:**
1. `fluree list` - verify correct ledger
2. `fluree query 'SELECT * WHERE { ?s ?p ?o } LIMIT 10'` - check if any data exists
3. `fluree log` - verify commits
4. Check prefix expansion: `fluree prefix list`

### Branch not found

**Symptom:** `fluree use mydb:dev` fails.

**Fix:**
```bash
fluree branch list mydb  # see available branches
fluree branch create dev --ledger mydb  # create if missing
```

### SPARQL UPDATE fails in direct mode

**Symptom:** SPARQL UPDATE syntax rejected without a server.

**Cause:** SPARQL UPDATE requires the server's parsing pipeline.

**Fix:**
- Start a server: `fluree server start`
- Or use `--remote` to target a remote server
- Or convert to JSON-LD update format for `--direct` mode

### Index out of date

**Symptom:** Queries are slow or return incomplete results after bulk import.

**Fix:**
```bash
fluree index       # incremental index update
fluree reindex     # full reindex from commit history
```

### Large file import fails or is slow

**Fix:** Tune import parameters:
```bash
fluree create mydb --from large.ttl \
  --memory-budget-mb 4096 \
  --parallelism 8 \
  --chunk-size-mb 100
```

### CSV/TSV output fails for remote ledger

**Cause:** `--format csv` and `--format tsv` are only supported for local ledgers.

**Fix:** Use `--format json` or `--format table` for remote/tracked ledgers.

## Diagnostic Commands

| Command | Purpose |
|---------|---------|
| `fluree list` | List all ledgers |
| `fluree info` | Show ledger details, commit count, index status |
| `fluree log` | Show commit history |
| `fluree show <commit>` | Inspect commit contents |
| `fluree prefix list` | Check IRI prefix mappings |
| `fluree branch list` | List branches |
| `fluree server status` | Check if server is running |
| `fluree auth status` | Check authentication |
