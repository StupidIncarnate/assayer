const receiver = (process.env.RECEIVER ?? '').split(',').map(Number);

export const ternaryNumberModuleExportedConstCondArrayLengthNumberReceiverEnv = receiver.length ? 'then' : 'else';
