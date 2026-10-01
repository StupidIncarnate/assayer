import { IpcInvokeRecordedErrorStub } from './ipc-invoke-recorded-error.stub';

describe('IpcInvokeRecordedErrorStub', () => {
  it('VALID: {channel, reply: no handler} => matches the error Electron builds for a channel main never registered', () => {
    const error = IpcInvokeRecordedErrorStub({
      channel: 'assayer:status',
      reply: "No handler registered for 'assayer:status'",
    });

    expect({ name: error.name, message: error.message }).toStrictEqual({
      name: 'Error',
      message:
        "Error invoking remote method 'assayer:status': No handler registered for 'assayer:status'",
    });
  });

  it('VALID: {channel, reply: a thrown Error} => matches the error Electron builds when the handler threw', () => {
    const error = IpcInvokeRecordedErrorStub({ channel: 'assayer:run', reply: 'Error: boom' });

    expect({ name: error.name, message: error.message }).toStrictEqual({
      name: 'Error',
      message: "Error invoking remote method 'assayer:run': Error: boom",
    });
  });
});
