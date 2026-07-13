import { analyzeFileBroker } from './analyze-file-broker';
import { analyzeFileBrokerProxy } from './analyze-file-broker.proxy';

describe('analyzeFileBroker', () => {
  describe('exported function with a guard clause', () => {
    it('VALID: {formatGreeting} => one case per exit with arrange values from the operand range', () => {
      analyzeFileBrokerProxy();
      const source =
        "export function formatGreeting(name: string): string {\n  if (name.length === 0) {\n    return 'Hello, stranger!';\n  }\n  return 'Hello, ' + name + '!';\n}\n";

      const result = analyzeFileBroker({ source, relPath: 'src/format-greeting.ts' });

      expect(result.functions.flatMap((fn) => fn.cases)).toStrictEqual([
        { reachesExit: 'formatGreeting/return@if-then', arrange: [{ param: 'name', value: '' }] },
        { reachesExit: 'formatGreeting/return@if-else', arrange: [{ param: 'name', value: 'a' }] },
      ]);
    });

    it('VALID: {formatGreeting} => enrichment for the param line and the branch operand line', () => {
      analyzeFileBrokerProxy();
      const source =
        "export function formatGreeting(name: string): string {\n  if (name.length === 0) {\n    return 'Hello, stranger!';\n  }\n  return 'Hello, ' + name + '!';\n}\n";

      const result = analyzeFileBroker({ source, relPath: 'src/format-greeting.ts' });

      expect(result.enrichment).toStrictEqual([
        { line: 1, symbol: 'name', typeText: 'string' },
        { line: 2, symbol: 'name', typeText: 'string', range: ['', 'a'] },
      ]);
    });
  });

  describe('parse error', () => {
    it('ERROR: {invalid source} => empty analysis', () => {
      analyzeFileBrokerProxy();

      const result = analyzeFileBroker({ source: 'const x = ;\n', relPath: 'src/x.ts' });

      expect(result).toStrictEqual({ functions: [], enrichment: [] });
    });
  });
});
