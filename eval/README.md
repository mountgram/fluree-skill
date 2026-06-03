# Fluree Skill Evals

This directory contains executable checks for the Fluree skill. The goal is to catch whether edits to `skills/fluree` still help an agent complete a one-shot Fluree task.

## Run

```bash
bun test eval
```

The default evals do not call an LLM. They verify that the local skill can be staged into an isolated workspace and that the Fluree CLI can complete a basic `init` / `create` / `upsert` / `query` workflow.

To run the one-shot agent eval with OpenCode:

```bash
RUN_AGENT_EVAL=1 bun test eval/fluree-agent.test.ts --timeout 240000
```

Optional environment variables:

- `OPENCODE_BIN`: OpenCode executable path, default `opencode`
- `OPENCODE_MODEL`: model passed to `opencode run -m`
- `OPENCODE_AGENT`: OpenCode agent passed to `opencode run --agent`, default `build`
- `AGENT_EVAL_TIMEOUT_MS`: process timeout, default `180000`

## Workspace

Each run creates a directory under `eval/workspace/`. That directory is git ignored except for `.gitkeep` so Fluree databases, OpenCode session state, and agent artifacts can be inspected after a run without being committed.

The eval stages the skill into both `.opencode/skills/fluree` and `.agents/skills/fluree` inside the run workspace. This makes the workspace compatible with OpenCode's native skill path and the broader Agent Skills project path used by the `skills` CLI.
