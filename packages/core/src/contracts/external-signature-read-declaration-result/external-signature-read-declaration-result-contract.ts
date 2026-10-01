/**
 * PURPOSE: Defines the data `externalSignatureReadDeclarationBroker` returns
 *
 * USAGE:
 * externalSignatureReadDeclarationResultContract.parse(value);
 * // Returns validated ExternalSignatureReadDeclarationResult
 */
import { z } from "#gateway/npm/zod";
import { externalSignatureContract } from "@assayer/shared/contracts";

export const externalSignatureReadDeclarationResultContract =
  z.discriminatedUnion("usable", [
    z
      .object({ usable: z.literal(true), signature: externalSignatureContract })
      .brand<"ExternalSignatureReadDeclarationResult">(),
    z
      .object({ usable: z.literal(false) })
      .brand<"ExternalSignatureReadDeclarationResult">(),
  ]);

export type ExternalSignatureReadDeclarationResult = z.infer<
  typeof externalSignatureReadDeclarationResultContract
>;
