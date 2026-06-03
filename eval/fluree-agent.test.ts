import { describe, expect, test } from "bun:test";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import {
  makeRunDir,
  prepareRunWorkspace,
  runCommand,
  runOpenCode,
  skillSourceDir,
} from "./agent-runner";

async function exists(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function assertSuccess(result: { code: number | null; stdout: string; stderr: string }) {
  expect(`${result.stdout}\n${result.stderr}`).toBeTruthy();
  expect(result.code).toBe(0);
}

describe("fluree skill eval harness", () => {
  test("stages the local skill into an isolated agent workspace", async () => {
    const runDir = makeRunDir("stage");
    await prepareRunWorkspace(runDir);

    expect(await exists(path.join(skillSourceDir, "SKILL.md"))).toBe(true);
    expect(await exists(path.join(runDir, ".opencode", "skills", "fluree", "SKILL.md"))).toBe(true);
    expect(await exists(path.join(runDir, ".agents", "skills", "fluree", "SKILL.md"))).toBe(true);
  });

  test("fluree CLI can complete the baseline workflow in the eval workspace", async () => {
    const runDir = makeRunDir("fluree-smoke");
    await prepareRunWorkspace(runDir);

    await assertSuccess(await runCommand("fluree", ["init"], { cwd: runDir }));
    await assertSuccess(await runCommand("fluree", ["create", "evaldb"], { cwd: runDir }));
    await assertSuccess(
      await runCommand(
        "fluree",
        [
          "upsert",
          '@prefix ex: <http://example.org/> . ex:alice a ex:Person ; ex:name "Alice" .',
        ],
        { cwd: runDir },
      ),
    );

    const query = await runCommand(
      "fluree",
      ["query", "--format", "json", "SELECT ?name WHERE { ?s <http://example.org/name> ?name }"],
      { cwd: runDir },
    );
    await assertSuccess(query);
    expect(query.stdout).toContain("Alice");
  });

  test.skipIf(process.env.RUN_AGENT_EVAL !== "1")(
    "opencode uses the staged Fluree skill to complete a one-shot Fluree task",
    async () => {
      const runDir = makeRunDir("opencode-one-shot");
      await prepareRunWorkspace(runDir);

      const prompt = `Use the fluree skill. Work only in this folder.

make me a tiny fluree db with alice in it and prove it worked. i don't care how, just use the current cli/docs/help if you need syntax. use agent_eval if you need a ledger name.

when you're done, leave me a receipt at agent-result.json like:
{"ledger":"agent_eval","foundAlice":true,"usedLiveDocsOrHelp":true,"summary":"..."}

don't ask me anything, just do it.`;

      const result = await runOpenCode({ cwd: runDir, prompt });
      await assertSuccess(result);

      const reportPath = path.join(runDir, "agent-result.json");
      expect(await exists(reportPath)).toBe(true);

      const report = JSON.parse(await readFile(reportPath, "utf8"));
      expect(report.ledger).toBe("agent_eval");
      expect(report.foundAlice).toBe(true);
      expect(report.usedLiveDocsOrHelp).toBe(true);

      const query = await runCommand(
        "fluree",
        ["query", "--format", "json", "SELECT ?name WHERE { ?s <http://example.org/name> ?name }"],
        { cwd: runDir },
      );
      await assertSuccess(query);
      expect(query.stdout).toContain("Alice");
    },
  );
});
