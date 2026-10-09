const receiver = process.env.RECEIVER ?? '';

export const ternaryNumberIifeCondStringLengthReceiverEnv = ((): string => {
    return receiver.length ? 'then' : 'else';
})();
