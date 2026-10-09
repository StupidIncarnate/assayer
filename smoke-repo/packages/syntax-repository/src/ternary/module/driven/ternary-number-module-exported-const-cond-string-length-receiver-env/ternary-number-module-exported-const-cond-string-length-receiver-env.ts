const receiver = process.env.RECEIVER ?? '';

export const ternaryNumberModuleExportedConstCondStringLengthReceiverEnv = receiver.length ? 'then' : 'else';
