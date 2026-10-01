/**
 * PURPOSE: Builds a valid UseAssayerStatusResult for tests
 *
 * USAGE:
 * UseAssayerStatusResultStub();
 * // Returns a valid UseAssayerStatusResult
 */
import type { StubArgument } from "@dungeonmaster/shared/@types";
import { StatusViewStub } from "../status-view/status-view.stub";

import { useAssayerStatusResultContract } from "./use-assayer-status-result-contract";
import type { UseAssayerStatusResult } from "./use-assayer-status-result-contract";

export const UseAssayerStatusResultStub = ({
  ...props
}: StubArgument<UseAssayerStatusResult> = {}): UseAssayerStatusResult =>
  useAssayerStatusResultContract.parse({
    data: StatusViewStub(),
    loading: false,
    error: new Error("sample"),
    ...props,
  });
