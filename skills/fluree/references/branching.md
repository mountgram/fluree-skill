# Branching

## Branch Lifecycle

Branches provide git-like isolation for ledger data. Each branch has its own commit history. Transactions on one branch are invisible to others.

Ledger IDs use the format `ledger:branch` (e.g., `mydb:main`, `mydb:dev`).

## Create Branch

```bash
fluree branch create dev
fluree branch create dev --ledger mydb
fluree branch create feature-x --from dev
fluree branch create rewind --at t:5
fluree branch create rewind --at 3dd028a7
```

| Option | Description |
|--------|-------------|
| `--from <BRANCH>` | Source branch (default: `main`) |
| `--at <REF>` | Branch from historical commit (`t:N` or hex digest/CID) |
| `--remote <R>` | Create on remote server |

Output:
```
Created branch 'dev' from 'main' at t=5
Ledger ID: mydb:dev
```

## List Branches

```bash
fluree branch list
fluree branch list mydb
```

Output:
```
 BRANCH     T   SOURCE
 main       5   -
 dev        7   main
 feature-x  8   dev
```

## Switch to Branch

```bash
fluree use mydb:dev
```

## Merge

Copies new commits from source into target. Fast-forward when target hasn't advanced.

```bash
fluree branch merge dev
fluree branch merge feature-x --target dev
fluree branch merge dev --strategy take-source
```

| Option | Description |
|--------|-------------|
| `--target <BRANCH>` | Target branch (default: source's parent) |
| `--strategy <S>` | Conflict resolution (default: `take-both`) |

Output:
```
Merged 'dev' into 'main' (fast-forward to t=8, 3 commits copied).
```

## Rebase

Replays branch's unique commits onto source's current HEAD.

```bash
fluree branch rebase dev
fluree branch rebase dev --strategy abort
```

Fast-forward when branch has no unique commits:
```
Fast-forward rebase of 'dev' to t=5.
```

With replay:
```
Rebased 'dev': 3 commits replayed, 0 skipped, 1 conflicts, 0 failures.
  New branch point: t=8
```

## Diff

Read-only merge preview. Does not mutate state.

```bash
fluree branch diff dev
fluree branch diff dev --target main
fluree branch diff dev --conflict-details --strategy take-source
fluree branch diff dev --json
```

| Option | Description |
|--------|-------------|
| `--target <BRANCH>` | Target to preview merging into |
| `--conflict-details` | Show source/target values for conflicts |
| `--no-conflicts` | Skip conflict computation |
| `--max-commits <N>` | Cap commit summaries (default: 50) |
| `--json` | Raw JSON output |

## Drop Branch

```bash
fluree branch drop dev
fluree branch drop dev --ledger mydb
```

- `main` cannot be dropped
- Leaf branches: fully deleted
- Branches with children: retracted (hidden, storage preserved for children)
- When last child is dropped, retracted parent is cascade-purged

## Conflict Strategies

| Strategy | Behavior |
|----------|----------|
| `take-both` | Keep both values (default) |
| `abort` | Fail on conflict |
| `take-source` | Source branch wins |
| `take-branch` | Current branch wins |
| `skip` | Skip conflicting commits |

## Common Workflows

### Feature branch workflow

```bash
fluree branch create feature-users
fluree use mydb:feature-users
fluree insert -f users.ttl -m "Add user data"
fluree branch diff feature-users
fluree branch merge feature-users
fluree branch drop feature-users
```

### Experimental branch from historical point

```bash
fluree branch create experiment --at t:3
fluree use mydb:experiment
fluree insert '@prefix ex: <http://example.org/> . ex:test ex:value 42 .'
fluree query 'SELECT * WHERE { ?s ?p ?o }'
```
