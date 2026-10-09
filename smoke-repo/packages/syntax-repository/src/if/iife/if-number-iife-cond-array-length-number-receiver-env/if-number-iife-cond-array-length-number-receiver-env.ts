const receiver = (process.env.RECEIVER ?? '').split(',').map(Number);

export const ifNumberIifeCondArrayLengthNumberReceiverEnv = ((): string => {
    if (receiver.length) {
        return 'then';
    }
    return 'else';
})();
