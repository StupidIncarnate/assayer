/**
 * PURPOSE: Builds a valid ConfigResolveLayerResult for tests
 *
 * USAGE:
 * ConfigResolveLayerResultStub();
 * // Returns a valid ConfigResolveLayerResult
 */
import type { StubArgument } from "@dungeonmaster/shared/@types";
import { AssayerConfigStub } from "@assayer/shared/contracts/assayer-config/assayer-config.stub";

import { configResolveLayerResultContract } from "./config-resolve-layer-result-contract";
import type { ConfigResolveLayerResult } from "./config-resolve-layer-result-contract";

export const ConfigResolveLayerResultStub = ({
  ...props
}: StubArgument<ConfigResolveLayerResult> = {}): ConfigResolveLayerResult =>
  configResolveLayerResultContract.parse({
    config: AssayerConfigStub(),
    configDir: "sample",
    configPath: "sample",
    ...props,
  });
