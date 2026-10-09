const receiver = (process.env.RECEIVER ?? '').split(',').map(item => item === 'true');

export const ternaryNumberModuleExportedConstCondArrayLengthBooleanReceiverEnv = receiver.length ? 'then' : 'else';
