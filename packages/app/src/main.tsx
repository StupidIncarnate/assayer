/**
 * PURPOSE: Vite entry — bootstraps the Assayer renderer by mounting the React application.
 *   Side-effect-only module (calls StartApp on load); mounting behavior is covered by the
 *   app-mount flow tests.
 *
 * USAGE:
 * // Referenced by index.html as the module entry script
 */
import { StartApp } from './startup/start-app';

StartApp();
