const receiver = process.env.RECEIVER ?? '';

export const ifNumberIifeCondStringLengthReceiverEnv = ((): string => {
    if (receiver.length) {
        return 'then';
    }
    return 'else';
})();
