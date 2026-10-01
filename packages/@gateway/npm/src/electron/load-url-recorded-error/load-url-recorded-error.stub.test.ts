import { LoadUrlRecordedErrorStub } from './load-url-recorded-error.stub';

describe('LoadUrlRecordedErrorStub', () => {
  it('VALID: {code: ERR_CONNECTION_REFUSED, url} => matches the error Electron builds for a refused connection', () => {
    const error = LoadUrlRecordedErrorStub({
      code: 'ERR_CONNECTION_REFUSED',
      url: 'http://localhost:6273',
    });

    expect({
      name: error.name,
      message: error.message,
      errno: error.errno,
      code: error.code,
      url: error.url,
    }).toStrictEqual({
      name: 'Error',
      message: "ERR_CONNECTION_REFUSED (-102) loading 'http://localhost:6273'",
      errno: -102,
      code: 'ERR_CONNECTION_REFUSED',
      url: 'http://localhost:6273',
    });
  });

  it('VALID: {code: ERR_FILE_NOT_FOUND, url} => matches the error Electron builds for a missing file', () => {
    const error = LoadUrlRecordedErrorStub({
      code: 'ERR_FILE_NOT_FOUND',
      url: 'file:///repo/packages/app/dist/index.html',
    });

    expect({
      name: error.name,
      message: error.message,
      errno: error.errno,
      code: error.code,
      url: error.url,
    }).toStrictEqual({
      name: 'Error',
      message: "ERR_FILE_NOT_FOUND (-6) loading 'file:///repo/packages/app/dist/index.html'",
      errno: -6,
      code: 'ERR_FILE_NOT_FOUND',
      url: 'file:///repo/packages/app/dist/index.html',
    });
  });

  it('EDGE: {url longer than 2048 characters} => cuts the URL in the message and keeps it whole in the url field', () => {
    const url = `http://localhost:6273/${'a'.repeat(2100)}`;

    const error = LoadUrlRecordedErrorStub({ code: 'ERR_CONNECTION_REFUSED', url });

    expect({ message: error.message, url: error.url }).toStrictEqual({
      message: `ERR_CONNECTION_REFUSED (-102) loading 'http://localhost:6273/${'a'.repeat(2026)}'`,
      url,
    });
  });
});
