/**
 * PURPOSE: Routes desktop preload startup to the bridge-expose responder.
 *
 * USAGE:
 * DesktopPreloadFlow();
 * // Exposes the preload bridge
 */
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { DesktopPreloadExposeResponder } from '../../responders/desktop-preload/expose/desktop-preload-expose-responder';

export const DesktopPreloadFlow = (): AdapterResult => DesktopPreloadExposeResponder();
