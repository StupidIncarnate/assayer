const receiver: string = 'abc';

export const ifNumberIifeCondStringLengthReceiverConst = ((): string => {
    if (receiver.length) {
        return 'then';
    }
    return 'else';
})();
