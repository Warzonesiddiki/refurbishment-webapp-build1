#!/usr/bin/env node
import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { getDevWithJavaUsage, parseDevWithJavaArgs } from './dev_with_java_args.mjs';

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';
const pythonCandidates = isWin ? ['python', 'python3', 'py'] : ['python3', 'python'];
const cwd = process.cwd();

let parsed;
try {
  parsed = parseDevWithJavaArgs(process.argv.slice(2), process.env);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[dev-with-java] ${message}`);
  console.error(getDevWithJavaUsage());
  process.exit(1);
}

if (parsed.showHelp) {
  console.log(getDevWithJavaUsage());
  process.exit(0);
}

const javaHealthHost = process.env.DEV_JAVA_HEALTH_HOST || '127.0.0.1';
const javaHealthPath = process.env.DEV_JAVA_HEALTH_PATH || '/api/health';
const javaHealthUrl = `http://${javaHealthHost}:${parsed.javaPort}${javaHealthPath}`;
const healthTimeoutMs = Number(process.env.DEV_JAVA_HEALTH_TIMEOUT_MS || 20000);
const healthIntervalMs = Number(process.env.DEV_JAVA_HEALTH_INTERVAL_MS || 500);
const healthBackoffFactor = Number(process.env.DEV_JAVA_HEALTH_BACKOFF_FACTOR || 1.25);
const healthMaxIntervalMs = Number(process.env.DEV_JAVA_HEALTH_MAX_INTERVAL_MS || 2000);
const allowFrontendWithoutJava = process.env.DEV_ALLOW_WEB_WITHOUT_JAVA === 'true';

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

async function waitForJavaHealth(timeoutMs = healthTimeoutMs) {
  const deadline = Date.now() + timeoutMs;
  let intervalMs = Math.max(100, healthIntervalMs);
  while (Date.now() < deadline) {
    try {
      const res = await fetch(javaHealthUrl);
      if (res.ok) return true;
    } catch {
      // retry
    }
    await sleep(intervalMs);
    intervalMs = Math.min(healthMaxIntervalMs, Math.floor(intervalMs * Math.max(1, healthBackoffFactor)));
  }
  return false;
}

const javaServerScript = join('tools', 'run_java_server.py');
if (!existsSync(javaServerScript)) {
  console.error(`[dev-with-java] missing ${javaServerScript}`);
  process.exit(1);
}

if (!hasCommand(npmCmd)) {
  console.error(`[dev-with-java] ${npmCmd} is not available in PATH.`);
  process.exit(1);
}

const python = findPython();
if (!python && !parsed.noJava) {
  console.error('[dev-with-java] Python runtime not found (expected python3/python/py).');
  process.exit(1);
}

let javaProc = null;
if (!parsed.noJava) {
  javaProc = startProcess(
    python,
    [javaServerScript, parsed.javaPort, `--build-tool=${parsed.buildTool}`],
    'java server',
  );
  if (!javaProc) process.exit(1);

  const javaHealthy = await waitForJavaHealth();
  if (!javaHealthy) {
    const message = `[dev-with-java] Java API did not become healthy at ${javaHealthUrl} within ${healthTimeoutMs}ms.`;
    if (!allowFrontendWithoutJava) {
      console.error(message);
      javaProc.kill('SIGTERM');
      process.exit(1);
    }
    console.warn(`${message} Continuing because DEV_ALLOW_WEB_WITHOUT_JAVA=true.`);
  }
}

const webScript = parsed.lanMode ? 'dev:lan:web' : 'dev:web';
const webProc = startProcess(npmCmd, ['run', webScript], 'vite dev server');
if (!webProc) {
  if (javaProc) javaProc.kill('SIGTERM');
  process.exit(1);
}

let shuttingDown = false;
function shutdown(signal, exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[dev-with-java] received ${signal}, stopping child processes...`);
  for (const proc of [webProc, javaProc]) {
    if (proc && !proc.killed) proc.kill('SIGTERM');
  }
  setTimeout(() => process.exit(exitCode), 300);
}

process.on('SIGINT', () => shutdown('SIGINT', 0));
process.on('SIGTERM', () => shutdown('SIGTERM', 0));

if (javaProc) {
  javaProc.on('exit', (code) => {
    if (!shuttingDown) {
      console.error(`[dev-with-java] java server exited with code ${code ?? 'unknown'}`);
      shutdown('java-exit', 1);
    }
  });
}

webProc.on('exit', (code) => {
  if (!shuttingDown) {
    console.log(`[dev-with-java] web process exited with code ${code ?? 'unknown'}, stopping java server.`);
    shutdown('web-exit', code && code !== 0 ? code : 0);
  }
});
