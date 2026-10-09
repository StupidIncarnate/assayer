const receiver = (process.env.RECEIVER ?? '').split(',').map(item => item === 'true');

export const ternaryNumberIifeCondArrayLengthBooleanReceiverEnv = ((): string => {
    return receiver.length ? 'then' : 'else';
})();
