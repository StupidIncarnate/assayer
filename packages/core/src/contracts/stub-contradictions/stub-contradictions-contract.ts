/**
 * PURPOSE: Defines the data `stubContradictionsTransformer` returns
 *
 * USAGE:
 * stubContradictionsContract.parse(value);
 * // Returns validated StubContradictions
 */
import { z } from "#gateway/npm/zod";

export const stubContradictionsContract = z
  .array(
    z
      .object({
        relPath: z.string().brand<"StubContradictionsRelPath">(),
        line: z.number().brand<"StubContradictionsLine">(),
        column: z.number().brand<"StubContradictionsColumn">(),
        message: z.string().brand<"StubContradictionsMessage">(),
      })
      .brand<"StubContradictions">(),
  )
  .readonly();

export type StubContradictions = z.infer<typeof stubContradictionsContract>;
