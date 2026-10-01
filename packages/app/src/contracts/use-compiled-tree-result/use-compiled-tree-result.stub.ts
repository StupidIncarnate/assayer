/**
 * PURPOSE: Builds a valid UseCompiledTreeResult for tests
 *
 * USAGE:
 * UseCompiledTreeResultStub();
 * // Returns a valid UseCompiledTreeResult
 */
import type { StubArgument } from "@dungeonmaster/shared/@types";
import { CompiledTreeStub } from "@assayer/shared/contracts/compiled-tree/compiled-tree.stub";

import { useCompiledTreeResultContract } from "./use-compiled-tree-result-contract";
import type { UseCompiledTreeResult } from "./use-compiled-tree-result-contract";

export const UseCompiledTreeResultStub = ({
  ...props
}: StubArgument<UseCompiledTreeResult> = {}): UseCompiledTreeResult =>
  useCompiledTreeResultContract.parse({
    data: CompiledTreeStub(),
    loading: false,
    error: new Error("sample"),
    ...props,
  });
