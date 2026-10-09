import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { moduleGraphProjectionTransformer } from '@assayer/core/module-graph';
import { fileWalkBroker as walkFileTransformer } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'multi-read.ts'), 'utf8');
const relPath = 'src/happy-path/env-object/multi-read/multi-read.ts';

const MODE_BRANCH =
  '*module*/if:BinaryExpression,PropertyAccessExpression,PropertyAccessExpression,id:process,id:env,id:MODE,EqualsEqualsEqualsToken,str:production';
const CASE_1_EXIT = '*module*/exit@switch:id:statusCode,EqualsEqualsEqualsToken,num:1#then';
const CASE_2_EXIT = '*module*/exit@switch:id:statusCode,EqualsEqualsEqualsToken,num:2#then';
const DEFAULT_EXIT =
  '*module*/exit@switch:id:statusCode,EqualsEqualsEqualsToken,num:1#else/switch:id:statusCode,EqualsEqualsEqualsToken,num:2#else';

describe('env-object / multi-read — two env reads, one in place and one through a const, both driven', () => {
  // `process.env.MODE === 'production'` reads the environment IN PLACE, with no binding between the
  // read and the comparison. The leaf is named by the read itself, carries the variable, and is typed
  // as the string Node declares, not as a member of some `process` parameter.
  it("VALID: {process.env.MODE === 'production' in place} => a leaf named by the read, carrying MODE and a string type", () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath, absPath: join(__dirname, 'multi-read.ts') }), relPath });

    expect(analysis.functions.flatMap((fn) => fn.branches).filter((branch) => branch.kind === 'if')).toStrictEqual([
      {
        coverageId: MODE_BRANCH,
        kind: 'if',
        condition: {
          kind: 'leaf',
          id: `${MODE_BRANCH}#leaf`,
          operandParamName: 'process.env.MODE',
          operandEnvVarName: 'MODE',
          operandType: { kind: 'string' },
          predicate: { kind: 'eq', literal: 'production' },
        },
        startLine: 1,
        endLine: 5,
      },
    ]);
  });

  // Both arms of the `if` fall through to the switch, so the module's exits are the switch's three
  // clause completions. Every case writes MODE and CODE before the import: MODE is the compared literal
  // on the `then` arm and the string representative on the `else` arm; CODE is each case literal, and
  // the number representative 7 for `default`, which matches neither. The first case per exit is the
  // salient one, and the `else`-arm twins reach the same exits.
  it('VALID: {an if on MODE before a switch on Number(CODE)} => one env case per arm combination, MODE written before CODE', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath, absPath: join(__dirname, 'multi-read.ts') }), relPath });

    expect(analysis.functions.flatMap((fn) => fn.cases)).toStrictEqual([
      {
        reachesPath: [CASE_1_EXIT],
        arrange: [
          { kind: 'env', name: 'MODE', value: 'production' },
          { kind: 'env', name: 'CODE', value: '1' },
        ],
        salient: true,
      },
      {
        reachesPath: [CASE_2_EXIT],
        arrange: [
          { kind: 'env', name: 'MODE', value: 'production' },
          { kind: 'env', name: 'CODE', value: '2' },
        ],
        salient: true,
      },
      {
        reachesPath: [DEFAULT_EXIT],
        arrange: [
          { kind: 'env', name: 'MODE', value: 'production' },
          { kind: 'env', name: 'CODE', value: '7' },
        ],
        salient: true,
      },
      {
        reachesPath: [CASE_1_EXIT],
        arrange: [
          { kind: 'env', name: 'MODE', value: 'abc123' },
          { kind: 'env', name: 'CODE', value: '1' },
        ],
        salient: false,
      },
      {
        reachesPath: [CASE_2_EXIT],
        arrange: [
          { kind: 'env', name: 'MODE', value: 'abc123' },
          { kind: 'env', name: 'CODE', value: '2' },
        ],
        salient: false,
      },
      {
        reachesPath: [DEFAULT_EXIT],
        arrange: [
          { kind: 'env', name: 'MODE', value: 'abc123' },
          { kind: 'env', name: 'CODE', value: '7' },
        ],
        salient: false,
      },
    ]);
  });

  it('VALID: {both branches driven by the environment} => admits nothing undriven', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath, absPath: join(__dirname, 'multi-read.ts') }), relPath });

    expect(analysis.undriven).toStrictEqual([]);
  });

  it('VALID: {a fully-understood file} => admits nothing as a dark spot', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath, absPath: join(__dirname, 'multi-read.ts') }), relPath });

    expect(analysis.darkSpots).toStrictEqual([]);
  });

  // Both env reads are captured for the stub: `MODE` compared to `'production'`, the literal the stub
  // guesses, and `CODE` read inside `Number(...)`, with no literal beside it. The per-property env
  // stubs the stitch folds these into are asserted in the stub-graph integration test.
  it('VALID: {process.env.CODE and process.env.MODE reads} => both captured, MODE carrying its compared literal', () => {
    const graph = moduleGraphProjectionTransformer({ walked: walkFileTransformer({ source, relPath, absPath: join(__dirname, 'multi-read.ts') }) });

    expect(graph.envReads).toStrictEqual([
      { property: 'MODE', literals: ['production'] },
      { property: 'CODE', literals: [] },
    ]);
  });
});
