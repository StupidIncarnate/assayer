/**
 * PURPOSE: Vite entry — bootstraps the Assayer renderer by mounting the React application.
 *
 * USAGE:
 * // Referenced by index.html as the module entry script
 */
import '@mantine/core/styles.css';

import { StartApp } from './startup/start-app';

StartApp();
