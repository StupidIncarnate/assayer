/**
 * PURPOSE: The error a real `BrowserWindow.loadURL` rejects with when the page cannot load, held as
 * data so a proxy can stage it with no window. Electron 32 builds it in
 * `lib/browser/api/web-contents.ts`: the message `<code> (<errno>) loading '<url>'`, with the URL cut
 * at 2048 characters, plus `errno`, `code` and the full `url` as fields. `ERR_CONNECTION_REFUSED` is
 * a dev server that is not running. `ERR_FILE_NOT_FOUND` is a renderer `index.html` that was never
 * built.
 *
 * USAGE:
 * LoadUrlRecordedErrorStub({ code: 'ERR_CONNECTION_REFUSED', url: 'http://localhost:6273' });
 * // Returns an Error with message "ERR_CONNECTION_REFUSED (-102) loading 'http://localhost:6273'",
 * // errno -102, code 'ERR_CONNECTION_REFUSED' and url 'http://localhost:6273'
 */

const chromiumNetErrno = {
  ERR_CONNECTION_REFUSED: -102,
  ERR_FILE_NOT_FOUND: -6,
} as const;

const messageUrlLimit = 2048;

export const LoadUrlRecordedErrorStub = ({
  code,
  url,
}: {
  code: keyof typeof chromiumNetErrno;
  url: string;
}): Error & { errno: number; code: string; url: string } =>
  Object.assign(
    new Error(`${code} (${chromiumNetErrno[code]}) loading '${url.substring(0, messageUrlLimit)}'`),
    { errno: chromiumNetErrno[code], code, url },
  );
