import { describe, expect, it } from 'vitest';
import { getDevWithJavaUsage, parseDevWithJavaArgs } from '../tools/dev_with_java_args.mjs';

describe('parseDevWithJavaArgs', () => {
  it('uses env defaults when args are omitted', () => {
    const parsed = parseDevWithJavaArgs([], {
      TAHIR_JAVA_BUILD_TOOL: 'maven',
      JAVA_API_PORT: '9090',
    });
    expect(parsed).toMatchObject({
      lanMode: false,
      noJava: false,
      showHelp: false,
      buildTool: 'maven',
      javaPort: '9090',
    });
  });

  it('accepts mixed short and long options', () => {
    const parsed = parseDevWithJavaArgs(['--lan', '--no-java', '--build-tool', 'javac', '--java-port=8087']);
    expect(parsed).toMatchObject({
      lanMode: true,
      noJava: true,
      buildTool: 'javac',
      javaPort: '8087',
    });
  });

  it('accepts help flag', () => {
    expect(parseDevWithJavaArgs(['--help']).showHelp).toBe(true);
    expect(parseDevWithJavaArgs(['-h']).showHelp).toBe(true);
  });

  it('throws on invalid build tool', () => {
    expect(() => parseDevWithJavaArgs(['--build-tool=nope'])).toThrow(/invalid build tool/i);
  });

  it('throws on invalid java port', () => {
    expect(() => parseDevWithJavaArgs(['--java-port', 'abc'])).toThrow(/must be numeric/i);
  });

  it('throws on unknown option', () => {
    expect(() => parseDevWithJavaArgs(['--wat'])).toThrow(/Unknown option/);
  });

  it('captures vite passthrough args after -- separator', () => {
    const parsed = parseDevWithJavaArgs(['--no-java', '--', '--port', '5180', '--strictPort']);
    expect(parsed.noJava).toBe(true);
    expect(parsed.webArgs).toEqual(['--port', '5180', '--strictPort']);
  });

  it('exposes usage text', () => {
    expect(getDevWithJavaUsage()).toContain('--no-java');
  });
});
