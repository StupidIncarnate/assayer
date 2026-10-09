const receiver: readonly string[] = ['a', 'b', 'c'];

export const ifNumberIifeCondArrayLengthStringReceiverConst = ((): string => {
    if (receiver.length) {
        return 'then';
    }
    return 'else';
})();
