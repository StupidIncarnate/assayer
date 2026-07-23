/**
 * PURPOSE: Contract for a stub KEY — the stable, committable identity of one stub in the stub
 *   repository, never a cache/node id. An OBJECT stub keys on its declared type identity
 *   `"<definitionRelPath>#<TypeName>"`; an ENV stub keys on `"process.env#<PROPERTY>"`. The key moves
 *   only on a real rename/relocate — the same stability contract the resolved index lives by — so a
 *   committed correction addresses the same stub across runs.
 *
 * USAGE:
 * stubKeyContract.parse('src/config/config.ts#Config');
 * stubKeyContract.parse('process.env#MODE');
 * // Returns a validated StubKey (branded)
 */
import { z } from 'zod';

export const stubKeyContract = z.string().min(1).brand<'StubKey'>();

export type StubKey = z.infer<typeof stubKeyContract>;
