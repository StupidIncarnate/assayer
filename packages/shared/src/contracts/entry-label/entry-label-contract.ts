/**
 * PURPOSE: Contract for an entry's human LABEL — the text a surface shows in place of an entry's
 *   internal `name`. A name is a coverage-ID segment, so it is built for identity: `*module*` for a
 *   module scope, and a whole structural projection for an anonymous function. Neither is readable,
 *   and both are cache-internal by ruling. This is the sentence about the entry, not the key.
 *
 *   Display only, and it must stay so: nothing derives, keys, matches or hashes on this. It is the
 *   same discipline `ArrangeText` keeps — one concept, one shape, so the CLI report and the desktop
 *   panel cannot name one entry two ways.
 *
 *   It is deliberately NOT a `SymbolName`. A symbol name is an identifier the reader could type; a
 *   label describes a scope that HAS no name (`rescale › items.map((n) => …) L2`), so typing it
 *   anywhere would be meaningless.
 *
 * USAGE:
 * entryLabelContract.parse('rescale › items.map((n) => …) L2');
 * // Returns a validated EntryLabel (branded)
 */
import { z } from '#gateway/npm/zod';

export const entryLabelContract = z.string().min(1).brand<'EntryLabel'>();

export type EntryLabel = z.infer<typeof entryLabelContract>;
