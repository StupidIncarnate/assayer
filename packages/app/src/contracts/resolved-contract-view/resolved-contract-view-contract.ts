/**
 * PURPOSE: Contract for a resolved contract view — the structured, DevTools-style inspector entry the
 *   Contracts tab renders for ONE cross-file import / ambient global a file uses. `symbol` names it,
 *   `source` says where it came from (`import '<path>' → <def>` for a local import, `pkg <name>` for a
 *   package/builtin, `global` for an ambient global), `inputs` is one rendered `name: type` line per
 *   param (the star of the section — empty when the callable takes none, which the widget shows as a
 *   `—`), and `output` is the `returns <type>` line, or the `type <type>` line for a member-access
 *   global with no signature. All fields are pre-rendered display cells — DISPLAY only, never analysis.
 *
 * USAGE:
 * resolvedContractViewContract.parse({
 *   symbol: 'greet', source: 'pkg vendored-pkg', inputs: ['name: string'], output: 'returns string',
 * });
 * // Returns a validated ResolvedContractView (branded cells)
 */
import { z } from '#gateway/npm/zod';


export const resolvedContractViewContract = z.object({
  symbol: z.string().min(1).brand<'ResolvedContractViewSymbol'>(),
  source: z.string().min(1).brand<'ResolvedContractViewSource'>(),
  inputs: z.array(z.string().min(1).brand<'ResolvedContractViewInputs'>()),
  output: z.string().min(1).brand<'ResolvedContractViewOutput'>().optional(),
});

export type ResolvedContractView = z.infer<typeof resolvedContractViewContract>;
