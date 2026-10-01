/**
 * PURPOSE: Defines the data `externalSignatureReadBroker` returns
 *
 * USAGE:
 * externalSignatureReadResultContract.parse(value);
 * // Returns validated ExternalSignatureReadResult
 */
import { z } from "#gateway/npm/zod";
import { externalSignatureContract } from "@assayer/shared/contracts";

export const externalSignatureReadResultContract = z.discriminatedUnion(
  "usable",
  [
    z
      .object({ usable: z.literal(true), signature: externalSignatureContract })
      .brand<"ExternalSignatureReadResult">(),
    z
      .object({ usable: z.literal(false) })
      .brand<"ExternalSignatureReadResult">(),
  ],
);

export type ExternalSignatureReadResult = z.infer<
  typeof externalSignatureReadResultContract
>;
