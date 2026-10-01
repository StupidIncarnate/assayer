/**
 * PURPOSE: Contract for a parameter descriptor — a single entry parameter's name paired with its
 *   serializable type descriptor, so the analyzer knows what value domain to arrange for it, plus
 *   whether a caller OWES it a value at all.
 *
 *   `optional` and `rest` are facts about the PARAMETER, not about its type: the checker widens
 *   `report?: (m: string) => void` to the same `(m: string) => void` a required parameter declares, so
 *   the type cannot answer whether omitting it is a legal call. They are carried only when true, so a
 *   plain required parameter serializes exactly as it always did and the content-keyed cache is
 *   unmoved.
 *
 *   `declaredText` is the SOURCE's own name for the type — the checker's canonical rendering of the
 *   declaration, carried only where the descriptor's own rendering would not reproduce it. It exists
 *   for the P1 invoice, which must name a type the reader can find in their own file: a
 *   `readonly [string, number]` enumerates as an anonymous shape carrying every member of
 *   `ReadonlyArray`, and `Box<string>` loses its argument the moment its reference resolves to the
 *   declaration named `Box`. DISPLAY only — no identity, no analysis, and absent whenever the
 *   descriptor already renders what the signature said.
 *
 * USAGE:
 * paramDescriptorContract.parse({ name: 'name', type: { kind: 'string' } });
 * paramDescriptorContract.parse({ name: 'report', type: { kind: 'callable', text: '() => void' }, optional: true });
 * // Returns a validated ParamDescriptor (branded fields)
 */
import { z } from '#gateway/npm/zod';

import { typeDescriptorContract } from '../type-descriptor/type-descriptor-contract';

export const paramDescriptorContract = z.object({
  name: z.string().min(1).brand<'ParamDescriptorName'>(),
  type: typeDescriptorContract,
  // `maybe(11)` is a legal call of `maybe(size: number, report?: (m: string) => void)`, so a caller
  // owes this parameter nothing.
  optional: z.boolean().optional(),
  // The same debt, spelled the other way: `collect(11)` is a legal call of `collect(size: number,
  // ...sinks: ((m: string) => void)[])`, which binds `sinks` to the empty array.
  rest: z.boolean().optional(),
  // What the SIGNATURE spelled, for the invoice — present only where the descriptor cannot say it.
  declaredText: z.string().min(1).brand<'ParamDescriptorDeclaredText'>().optional(),
});

export type ParamDescriptor = z.infer<typeof paramDescriptorContract>;
