#!/usr/bin/env node
import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';
const pythonCandidates = isWin ? ['python', 'python3', 'py'] : ['python3', 'python'];
const args = process.argv.slice(2);
const lanMode = args.includes('--lan');
const cwd = process.cwd();
const javaPort = process.env.JAVA_API_PORT || '8085';
const javaHealthUrl = `http://127.0.0.1:${javaPort}/api/health`;

function quoteShellArg(value) {
  if (/^[A-Za-z0-9_./:-]+$/.test(value)) return value;
  return `"${String(value).replace(/"/g, '\\"')}"`;
}

function startProcess(command, commandArgs, name) {
  const options = { cwd, stdio: 'inherit' };

  try {
    const proc = isWin
      ? spawn([command, ...commandArgs].map(quoteShellArg).join(' '), { ...options, shell: true })
      : spawn(command, commandArgs, options);

    proc.on('error', (error) => {
      console.error(`[dev-with-java] failed to start ${name}:`, error.message);
    });
    return proc;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[dev-with-java] failed to spawn ${name}: ${message}`);
    return null;
  }
}

function hasCommand(command) {
  const probe = spawnSync(command, ['--version'], { stdio: 'ignore', shell: isWin });
  return !probe.error && probe.status === 0;
}

function findPython() {
  for (const candidate of pythonCandidates) {
    const probe = spawnSync(candidate, ['--version'], { stdio: 'ignore', shell: isWin });
    if (!probe.error && probe.status === 0) return candidate;
  }
  return null;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForJavaHealth(timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(javaHealthUrl);
      if (res.ok) return true;
    } catch {
      // retry
    }
    await sleep(500);
  }
  return false;
}

const javaServerScript = join('tools', 'run_java_server.py');
if (!existsSync(javaServerScript)) {
  console.error(`[dev-with-java] missing ${javaServerScript}`);
  process.exit(1);
}

// Stability fix: fail fast with clear diagnostics when npm is unavailable.
if (!hasCommand(npmCmd)) {
  console.error(`[dev-with-java] ${npmCmd} is not available in PATH.`);
  process.exit(1);
}

const python = findPython();
if (!python) {
  console.error('[dev-with-java] Python runtime not found (expected python3/python/py).');
  process.exit(1);
}

const javaProc = startProcess(python, [javaServerScript, javaPort], 'java server');
if (!javaProc) process.exit(1);

const javaHealthy = await waitForJavaHealth();
if (!javaHealthy) {
  console.error(`[dev-with-java] Java API did not become healthy at ${javaHealthUrl}.`);
  javaProc.kill('SIGTERM');
  process.exit(1);
}

const webScript = lanMode ? 'dev:lan:web' : 'dev:web';
const webProc = startProcess(npmCmd, ['run', webScript], 'vite dev server');
if (!webProc) {
  javaProc.kill('SIGTERM');
  process.exit(1);
}

let shuttingDown = false;
function shutdown(signal, exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[dev-with-java] received ${signal}, stopping child processes...`);
  for (const proc of [webProc, javaProc]) {
    if (!proc.killed) proc.kill('SIGTERM');
  }
  setTimeout(() => process.exit(exitCode), 300);
}

process.on('SIGINT', () => shutdown('SIGINT', 0));
process.on('SIGTERM', () => shutdown('SIGTERM', 0));

javaProc.on('exit', (code) => {
  if (!shuttingDown) {
    console.error(`[dev-with-java] java server exited with code ${code ?? 'unknown'}`);
    shutdown('java-exit', 1);
  }
});

webProc.on('exit', (code) => {
  if (!shuttingDown) {
    console.log(`[dev-with-java] web process exited with code ${code ?? 'unknown'}, stopping java server.`);
    shutdown('web-exit', code && code !== 0 ? code : 0);
  }
});
