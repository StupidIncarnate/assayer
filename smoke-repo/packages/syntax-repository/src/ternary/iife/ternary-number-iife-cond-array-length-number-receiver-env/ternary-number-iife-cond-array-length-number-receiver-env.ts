const receiver = (process.env.RECEIVER ?? '').split(',').map(Number);

export const ternaryNumberIifeCondArrayLengthNumberReceiverEnv = ((): string => {
    return receiver.length ? 'then' : 'else';
})();
