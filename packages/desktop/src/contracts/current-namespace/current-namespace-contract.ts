/**
 * PURPOSE: Defines the data `currentNamespaceTransformer` returns
 *
 * USAGE:
 * currentNamespaceContract.parse(value);
 * // Returns validated CurrentNamespace
 */
import { z } from "#gateway/npm/zod";
import { contentHashContract } from "@assayer/shared/contracts";

export const currentNamespaceContract = z
  .object({
    namespaceName: z.string().brand<"CurrentNamespaceNamespaceName">(),
    files: z.array(
      z
        .object({
          relPath: z.string().brand<"CurrentNamespaceFilesRelPath">(),
          contentHash: contentHashContract,
        })
        .brand<"CurrentNamespaceFiles">(),
    ),
  })
  .brand<"CurrentNamespace">();

export type CurrentNamespace = z.infer<typeof currentNamespaceContract>;
