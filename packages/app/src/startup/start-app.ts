/**
 * PURPOSE: Renderer startup — delegates to the app-mount flow to mount the React application.
 *
 * USAGE:
 * StartApp();
 * // Mounts the assayer renderer into #root
 */
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { AppMountFlow } from '../flows/app-mount/app-mount-flow';

export const StartApp = (): AdapterResult => AppMountFlow();
