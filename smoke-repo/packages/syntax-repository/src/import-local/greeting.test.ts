import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { moduleGraphProjectionTransformer } from '@assayer/core/module-graph';
import { tsMorphWalkFileAdapter } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'greeting.ts'), 'utf8');
const relPath = 'src/import-local/greeting.ts';

describe('import-local / greeting — the imported definition a sibling calls', () => {
  // It is a plain exported function: one named entry, nothing cross-file of its own.
  it('VALID: {an exported function} => is a single named entry', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect(analysis.functions.map((fn) => ({ name: fn.entry.name, access: fn.entry.access }))).toStrictEqual([
      { name: 'greeting', access: { kind: 'named' } },
    ]);
  });

  // It imports nothing, so its module graph is empty — the reference lives in the file that calls it.
  it('EMPTY: {no imports} => an empty module graph', () => {
    const graph = moduleGraphProjectionTransformer({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect(graph).toStrictEqual({ edges: [], references: [], globalUses: [] });
  });
});
