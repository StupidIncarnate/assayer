/**
 * PURPOSE: Defines the data `stableNamespaceLayerBroker` returns
 *
 * USAGE:
 * stableNamespaceLayerResultContract.parse(value);
 * // Returns validated StableNamespaceLayerResult
 */
import { z } from "#gateway/npm/zod";
import {
  compileModeContract,
  contentHashContract,
} from "@assayer/shared/contracts";
import { sourcePositionContract } from "../source-position/source-position-contract";

export const stableNamespaceLayerResultContract = z
  .object({
    resultEntry: z
      .object({
        namespace: z
          .string()
          .brand<"StableNamespaceLayerResultResultEntryNamespace">(),
        branch: z
          .string()
          .brand<"StableNamespaceLayerResultResultEntryBranch">(),
        mode: compileModeContract,
        fileCount: z
          .number()
          .brand<"StableNamespaceLayerResultResultEntryFileCount">(),
      })
      .brand<"StableNamespaceLayerResultResultEntry">(),
    manifestNamespace: z
      .object({
        branch: z
          .string()
          .brand<"StableNamespaceLayerResultManifestNamespaceBranch">(),
        commit: z
          .string()
          .brand<"StableNamespaceLayerResultManifestNamespaceCommit">()
          .optional(),
        files: z.array(
          z
            .object({
              relPath: z
                .string()
                .brand<"StableNamespaceLayerResultManifestNamespaceFilesRelPath">(),
              contentHash: contentHashContract,
            })
            .brand<"StableNamespaceLayerResultManifestNamespaceFiles">(),
        ),
      })
      .brand<"StableNamespaceLayerResultManifestNamespace">(),
    harnesses: z.array(
      z
        .object({
          relPath: z
            .string()
            .brand<"StableNamespaceLayerResultHarnessesRelPath">(),
          content: z
            .string()
            .brand<"StableNamespaceLayerResultHarnessesContent">(),
        })
        .brand<"StableNamespaceLayerResultHarnesses">(),
    ),
    errors: z.array(
      z
        .object({
          namespace: z
            .string()
            .brand<"StableNamespaceLayerResultErrorsNamespace">(),
          relPath: z
            .string()
            .brand<"StableNamespaceLayerResultErrorsRelPath">(),
          line: z.number().brand<"StableNamespaceLayerResultErrorsLine">(),
          column: sourcePositionContract.shape.column,
          message: z
            .string()
            .brand<"StableNamespaceLayerResultErrorsMessage">(),
        })
        .brand<"StableNamespaceLayerResultErrors">(),
    ),
  })
  .brand<"StableNamespaceLayerResult">();

export type StableNamespaceLayerResult = z.infer<
  typeof stableNamespaceLayerResultContract
>;
