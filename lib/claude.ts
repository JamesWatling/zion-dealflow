import { spawn } from "node:child_process";

// Runs the Claude Code CLI in headless print mode (`claude -p`) so analysis uses
// the user's Claude subscription — no API key. Requires Claude Code installed and
// logged in on the machine running the worker. Override the binary with CLAUDE_BIN.
export interface ClaudeOpts {
  model?: string;
  timeoutMs?: number;
  allowedTools?: string[]; // e.g. ["WebSearch","WebFetch"] to let the agent search the web
}

export function runClaude(prompt: string, opts: ClaudeOpts = {}): Promise<string> {
  const bin = process.env.CLAUDE_BIN || "claude";
  const args = ["-p"];
  if (opts.model) args.push("--model", opts.model);
  if (opts.allowedTools?.length) args.push("--allowedTools", opts.allowedTools.join(","));
  const timeoutMs = opts.timeoutMs ?? 240000;

  return new Promise((resolve, reject) => {
    let settled = false;
    const settle = (fn: () => void) => {
      if (settled) return;
      settled = true;
      fn();
    };

    // detached → own process group, so timeout can kill the whole tree (no zombies)
    const child = spawn(bin, args, { stdio: ["pipe", "pipe", "pipe"], detached: true });
    let out = "";
    let err = "";

    const timer = setTimeout(() => {
      try {
        if (child.pid) process.kill(-child.pid, "SIGKILL");
      } catch {
        /* group already gone */
      }
      settle(() => reject(new Error(`claude timed out after ${timeoutMs}ms`)));
    }, timeoutMs);

    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    child.stdin.on("error", () => {
      /* ignore EPIPE if claude exits before consuming stdin */
    });
    child.on("error", (e) => {
      clearTimeout(timer);
      settle(() => reject(new Error(`failed to spawn '${bin}': ${(e as Error).message}. Is Claude Code installed + logged in?`)));
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      settle(() =>
        code === 0
          ? resolve(out.trim())
          : reject(new Error(`claude exited ${code}: ${(err.trim() || out.trim()).slice(0, 500)}`)),
      );
    });

    child.stdin.write(prompt);
    child.stdin.end();
  });
}

// Extract the first *balanced* JSON object, tolerating surrounding prose,
// code fences, and braces that appear inside strings.
export function extractJSON<T>(text: string): T {
  const stripped = text.replace(/```(?:json)?/gi, "");
  const start = stripped.indexOf("{");
  if (start === -1) throw new Error("no JSON object found in Claude output");
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < stripped.length; i++) {
    const ch = stripped[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
    } else if (ch === '"') inStr = true;
    else if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return JSON.parse(stripped.slice(start, i + 1)) as T;
    }
  }
  throw new Error("unbalanced JSON in Claude output");
}

export async function runClaudeJSON<T>(prompt: string, opts?: ClaudeOpts): Promise<T> {
  const text = await runClaude(
    prompt + "\n\nReturn ONLY a single valid JSON object — no prose, no markdown code fences.",
    opts,
  );
  return extractJSON<T>(text);
}
