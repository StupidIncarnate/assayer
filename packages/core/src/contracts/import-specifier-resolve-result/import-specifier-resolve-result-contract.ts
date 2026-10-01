/**
 * PURPOSE: Defines the data `importSpecifierResolveBroker` returns
 *
 * USAGE:
 * importSpecifierResolveResultContract.parse(value);
 * // Returns validated ImportSpecifierResolveResult
 */
import { z } from "#gateway/npm/zod";

export const importSpecifierResolveResultContract = z.discriminatedUnion(
  "resolved",
  [
    z
      .object({ resolved: z.literal(false) })
      .brand<"ImportSpecifierResolveResult">(),
    z
      .object({
        resolved: z.literal(true),
        fileName: z.string().brand<"ImportSpecifierResolveResultFileName">(),
      })
      .brand<"ImportSpecifierResolveResult">(),
  ],
);

export type ImportSpecifierResolveResult = z.infer<
  typeof importSpecifierResolveResultContract
>;
