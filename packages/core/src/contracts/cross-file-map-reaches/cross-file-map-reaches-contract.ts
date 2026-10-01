/**
 * PURPOSE: Defines the data `crossFileMapReachesTransformer` returns
 *
 * USAGE:
 * crossFileMapReachesContract.parse(value);
 * // Returns validated CrossFileMapReaches
 */
import { z } from "#gateway/npm/zod";
import { scopeRecordContract } from "../scope-record/scope-record-contract";

export const crossFileMapReachesContract = z.array(
  z
    .object({
      host: scopeRecordContract,
      arrayParam: z.string().brand<"CrossFileMapReachesArrayParam">(),
      specifier: z.string().brand<"CrossFileMapReachesSpecifier">(),
      importedName: z.string().brand<"CrossFileMapReachesImportedName">(),
    })
    .brand<"CrossFileMapReaches">(),
);

export type CrossFileMapReaches = z.infer<typeof crossFileMapReachesContract>;
