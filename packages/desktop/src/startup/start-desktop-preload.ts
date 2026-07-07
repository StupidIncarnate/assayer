/**
 * PURPOSE: Desktop preload startup — delegates to the desktop preload flow.
 *
 * USAGE:
 * StartDesktopPreload();
 * // Exposes the preload bridge
 */
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { DesktopPreloadFlow } from '../flows/desktop-preload/desktop-preload-flow';

export const StartDesktopPreload = (): AdapterResult => DesktopPreloadFlow();
