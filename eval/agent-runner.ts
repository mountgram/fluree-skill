import { spawn } from "node:child_process";
import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";

export const evalDir = path.resolve(import.meta.dir);
export const repoRoot = path.resolve(evalDir, "..");
export const workspaceRoot = path.join(evalDir, "workspace");
export const skillSourceDir = path.join(repoRoot, "skills", "fluree");

export type CommandResult = {
  code: number | null;
  stdout: string;
  stderr: string;
};

export type OpenCodeRunOptions = {
  cwd: string;
  prompt: string;
  timeoutMs?: number;
};

export function makeRunDir(prefix = "run") {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const suffix = Math.random().toString(36).slice(2, 8);
  return path.join(workspaceRoot, `${prefix}-${stamp}-${suffix}`);
}

export async function prepareRunWorkspace(runDir: string) {
  await mkdir(runDir, { recursive: true });
  await stageSkill(runDir);
}

export async function stageSkill(runDir: string) {
  const targets = [
    path.join(runDir, ".opencode", "skills", "fluree"),
    path.join(runDir, ".agents", "skills", "fluree"),
  ];

  for (const target of targets) {
    await rm(target, { recursive: true, force: true });
    await mkdir(path.dirname(target), { recursive: true });
    await cp(skillSourceDir, target, { recursive: true });
  }
}

export async function runCommand(
  command: string,
  args: string[],
  options: { cwd: string; timeoutMs?: number; env?: NodeJS.ProcessEnv },
): Promise<CommandResult> {
  return await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: { ...process.env, ...options.env },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const timeout = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
    }, options.timeoutMs ?? 120_000);

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timeout);
      if (timedOut) {
        stderr += `\nTimed out after ${options.timeoutMs ?? 120_000}ms`;
      }
      resolve({ code, stdout, stderr });
    });
  });
}

export async function runOpenCode(options: OpenCodeRunOptions) {
  const opencodeBin = process.env.OPENCODE_BIN ?? "opencode";
  const args = [
    "run",
    "--dir",
    options.cwd,
    "--format",
    "json",
    "--dangerously-skip-permissions",
  ];

  if (process.env.OPENCODE_MODEL) {
    args.push("-m", process.env.OPENCODE_MODEL);
  }

  args.push("--agent", process.env.OPENCODE_AGENT ?? "build");
  args.push(options.prompt);

  return await runCommand(opencodeBin, args, {
    cwd: options.cwd,
    timeoutMs: options.timeoutMs ?? Number(process.env.AGENT_EVAL_TIMEOUT_MS ?? 180_000),
  });
}
