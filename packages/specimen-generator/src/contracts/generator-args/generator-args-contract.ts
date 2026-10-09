/**
 * PURPOSE: The arguments a generator run accepts after its command line is parsed. Reach for this
 * when passing a run's options between the responder and the brokers.
 *
 * USAGE:
 * generatorArgsContract.parse({ mode: 'check', focus: ['if'], depth: 1 });
 * // Returns GeneratorArgs
 */
import { z } from '#gateway/npm/zod';

export const generatorArgsContract = z
  .object({
    mode: z.enum(['write', 'check']),
    focus: z.array(z.string().min(1).brand<'GeneratorArgsFocus'>()).optional(),
    container: z.array(z.string().min(1).brand<'GeneratorArgsContainer'>()).optional(),
    depth: z.number().int().min(0).brand<'GeneratorArgsDepth'>().optional(),
  })
  .brand<'GeneratorArgs'>();

export type GeneratorArgs = z.infer<typeof generatorArgsContract>;
