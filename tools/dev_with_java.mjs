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

function startProcess(command, commandArgs, name) {
  const proc = spawn(command, commandArgs, { cwd, stdio: 'inherit' });
  proc.on('error', (error) => {
    console.error(`[dev-with-java] failed to start ${name}:`, error.message);
  });
  return proc;
}

function findPython() {
  for (const candidate of pythonCandidates) {
    const probe = spawnSync(candidate, ['--version'], { stdio: 'ignore' });
    if (!probe.error && probe.status === 0) return candidate;
  }
  return null;
}

const javaServerScript = join('tools', 'run_java_server.py');
if (!existsSync(javaServerScript)) {
  console.error(`[dev-with-java] missing ${javaServerScript}`);
  process.exit(1);
}

const python = findPython();
if (!python) {
  console.error('[dev-with-java] Python runtime not found (expected python3/python/py).');
  process.exit(1);
}

const javaProc = startProcess(python, [javaServerScript, '8085'], 'java server');
const webScript = lanMode ? 'dev:lan' : 'dev';
const webProc = startProcess(npmCmd, ['run', webScript], 'vite dev server');

let shuttingDown = false;
function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[dev-with-java] received ${signal}, stopping child processes...`);
  for (const proc of [webProc, javaProc]) {
    if (!proc.killed) proc.kill('SIGTERM');
  }
  setTimeout(() => process.exit(0), 300);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

javaProc.on('exit', (code) => {
  if (!shuttingDown && code !== 0) {
    console.error(`[dev-with-java] java server exited with code ${code}`);
  }
});

webProc.on('exit', (code) => {
  if (!shuttingDown) {
    console.log(`[dev-with-java] web process exited with code ${code}, stopping java server.`);
    shutdown('web-exit');
  }
});
