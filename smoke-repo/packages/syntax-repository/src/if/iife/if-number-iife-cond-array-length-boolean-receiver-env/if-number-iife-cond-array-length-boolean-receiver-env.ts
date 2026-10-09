const receiver = (process.env.RECEIVER ?? '').split(',').map(item => item === 'true');

export const ifNumberIifeCondArrayLengthBooleanReceiverEnv = ((): string => {
    if (receiver.length) {
        return 'then';
    }
    return 'else';
})();
