/**
 * PURPOSE: Orchestrates renderer startup — delegates to the mount responder to render the app.
 *
 * USAGE:
 * AppMountFlow();
 * // Mounts the app; returns { success: true }
 */
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { AppMountResponder } from '../../responders/app/mount/app-mount-responder';

export const AppMountFlow = (): AdapterResult => AppMountResponder();
