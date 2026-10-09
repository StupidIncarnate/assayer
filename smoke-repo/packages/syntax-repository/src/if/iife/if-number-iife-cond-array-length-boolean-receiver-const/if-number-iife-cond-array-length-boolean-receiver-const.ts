const receiver: readonly boolean[] = [true, false, true];

export const ifNumberIifeCondArrayLengthBooleanReceiverConst = ((): string => {
    if (receiver.length) {
        return 'then';
    }
    return 'else';
})();
