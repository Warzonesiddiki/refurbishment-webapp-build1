const allowedBuildTools = new Set(['auto', 'javac', 'maven']);

function readValue(argv, index, option) {
  const token = argv[index];
  const eq = `${option}=`;
  if (token.startsWith(eq)) {
    return { value: token.slice(eq.length), consumed: 1 };
  }
  if (token === option) {
    const next = argv[index + 1];
    if (!next || next.startsWith('-')) {
      throw new Error(`${option} requires a value`);
    }
    return { value: next, consumed: 2 };
  }
  return null;
}

export function parseDevWithJavaArgs(argv, env = process.env) {
  const result = {
    lanMode: false,
    noJava: false,
    showHelp: false,
    buildTool: (env.TAHIR_JAVA_BUILD_TOOL || 'auto').toLowerCase(),
    javaPort: env.JAVA_API_PORT || '8085',
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];

    if (token === '--lan') {
      result.lanMode = true;
      continue;
    }
    if (token === '--no-java') {
      result.noJava = true;
      continue;
    }
    if (token === '--help' || token === '-h') {
      result.showHelp = true;
      continue;
    }

    const buildToolArg = readValue(argv, i, '--build-tool');
    if (buildToolArg) {
      result.buildTool = buildToolArg.value.toLowerCase();
      i += buildToolArg.consumed - 1;
      continue;
    }

    const portArg = readValue(argv, i, '--java-port');
    if (portArg) {
      if (!/^\d+$/.test(portArg.value)) {
        throw new Error(`--java-port must be numeric (got: ${portArg.value})`);
      }
      result.javaPort = portArg.value;
      i += portArg.consumed - 1;
      continue;
    }

    throw new Error(`Unknown option: ${token}`);
  }

  if (!allowedBuildTools.has(result.buildTool)) {
    throw new Error(`invalid build tool: ${result.buildTool}. Allowed: auto|javac|maven`);
  }

  return result;
}

export function getDevWithJavaUsage() {
  return [
    'Usage: node tools/dev_with_java.mjs [options]',
    '',
    'Options:',
    '  --lan                      Run Vite in LAN mode (dev:lan:web).',
    '  --no-java                  Skip Java startup and run frontend only.',
    '  --build-tool <tool>        Java build tool: auto|javac|maven.',
    '  --java-port <port>         Java API port (default: JAVA_API_PORT or 8085).',
    '  -h, --help                 Show this help text.',
  ].join('\n');
}
