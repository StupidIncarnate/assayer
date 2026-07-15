/**
 * PURPOSE: Interprets a raw type fact (the ts-morph adapter's serializable type readout) into a
 *   serializable TypeDescriptor — the SINGLE place any type is turned into the analysis model, so no
 *   two bits of code encode type semantics. Primitives map straight across; a literal becomes a
 *   `literal` descriptor; a union collapses to a `union` descriptor ONLY when every member is a
 *   literal (otherwise it degrades to `unknown` carrying the union's display text). Recurses over
 *   union members, so nested/enumerated shapes are handled by the same one unit.
 *
 * USAGE:
 * typeDescriptorTransformer({ fact: { flavor: 'string' } });
 * // Returns { kind: 'string' } (validated TypeDescriptor)
 */
import { typeDescriptorContract } from '@assayer/shared/contracts';
import type { TypeDescriptor } from '@assayer/shared/contracts';

import type { TypeFact } from '../../contracts/type-fact/type-fact-contract';

export const typeDescriptorTransformer = ({ fact }: { fact: TypeFact }): TypeDescriptor => {
  switch (fact.flavor) {
    case 'string':
      return typeDescriptorContract.parse({ kind: 'string' });
    case 'number':
      return typeDescriptorContract.parse({ kind: 'number' });
    case 'boolean':
      return typeDescriptorContract.parse({ kind: 'boolean' });
    case 'literal':
      return typeDescriptorContract.parse({ kind: 'literal', value: fact.value });
    case 'union': {
      const literalMembers = fact.members.filter((member) => member.flavor === 'literal');
      return literalMembers.length === fact.members.length
        ? typeDescriptorContract.parse({
            kind: 'union',
            members: fact.members.map((member) => typeDescriptorTransformer({ fact: member })),
          })
        : typeDescriptorContract.parse({ kind: 'unknown', text: fact.text });
    }
    case 'other':
      return typeDescriptorContract.parse({ kind: 'unknown', text: fact.text });
    default:
      return typeDescriptorContract.parse({ kind: 'unknown', text: 'unknown' });
  }
};
