/**
 * PURPOSE: Defines the data `harnessLoadBroker` returns
 *
 * USAGE:
 * harnessLoadResultContract.parse(value);
 * // Returns validated HarnessLoadResult
 */
import { z } from "#gateway/npm/zod";
import { harnessDeclarationContract } from "../harness-declaration/harness-declaration-contract";

export const harnessLoadResultContract = z.discriminatedUnion("ok", [
  z
    .object({
      ok: z.literal(true),
      declarations: z.array(harnessDeclarationContract),
    })
    .brand<"HarnessLoadResult">(),
  z
    .object({
      ok: z.literal(false),
      message: z.string().brand<"HarnessLoadResultMessage">(),
    })
    .brand<"HarnessLoadResult">(),
]);

export type HarnessLoadResult = z.infer<typeof harnessLoadResultContract>;
