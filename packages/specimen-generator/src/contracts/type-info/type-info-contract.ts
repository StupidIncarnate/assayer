/**
 * PURPOSE: What the generator knows about one type it can fill a hole with: the value a known leaf
 * writes, sample values, and the source text an env leaf and an external leaf write. An array type has no env text, because env is
 * never offered for an array-typed hole. Reach for this
 * when planning or rendering a leaf. A type the generator does not know has no TypeInfo.
 *
 * USAGE:
 * typeInfoContract.parse({ known: 3, samples: [10, 20, 30], env: 'Number(process.env.KEY)', external: 'Number(process.argv[2])' });
 * // Returns a TypeInfo
 */
import { z } from '#gateway/npm/zod';

export const typeInfoContract = z
  .object({
    known: z.json(),
    samples: z.array(z.json()),
    env: z.string().min(1).brand<'TypeInfoEnv'>().optional(),
    external: z.string().min(1).brand<'TypeInfoExternal'>(),
  })
  .brand<'TypeInfo'>();

export type TypeInfo = z.infer<typeof typeInfoContract>;
