import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { walkFileTransformer } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'types-only.ts'), 'utf8');
const relPath = 'src/happy-path/object/types-only/types-only.ts';

describe('object / types-only — a declaration-only module, no signature mentions its own shape', () => {
  // Bespoke to this file: nothing in the module is exported EXCEPT the interface itself, so no
  // scope's params or return type carry an object descriptor to enumerate `Config` through. Only the
  // DECLARATION channel populates `declaredTypes` (CLAUDE.md §3 — `declared-types-projection` gathers
  // from TWO walk channels and needs both; a types-only file mentions its own shape in no signature, so
  // the signature channel alone would leave this file's declared surface empty).
  it('VALID: {export interface Config with no consuming signature} => declaredTypes still carries Config', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath }), relPath });

    expect(analysis.declaredTypes).toStrictEqual([
      {
        name: 'Config',
        properties: [
          { name: 'mode', type: { kind: 'string' } },
          { name: 'retries', type: { kind: 'number' } },
        ],
      },
    ]);
  });

  // The point of the rung: a declaration-only file offers no exported function and no top-level branch,
  // call, value use, or ambient-global call — so `analysisProjectionTransformer` finds NOTHING worth an
  // entry (CLAUDE.md — a module scope becomes an entry only when it holds branch logic or CONSUMES an
  // external; declaring a shape is neither). Zero functions, zero cases, and no admission on any
  // channel is CLEAN under the ruling: nothing to run is not a failure, and a declared-but-unconsumed
  // type is testable surface for whoever consumes it, never a debt this file owes on its own.
  it('VALID: {a declaration-only module} => zero entries, zero cases, and no admission on any channel', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath }), relPath });

    expect({
      functions: analysis.functions,
      gaps: analysis.gaps,
      darkSpots: analysis.darkSpots,
      undriven: analysis.undriven,
      lints: analysis.lints,
    }).toStrictEqual({ functions: [], gaps: [], darkSpots: [], undriven: [], lints: [] });
  });
});
