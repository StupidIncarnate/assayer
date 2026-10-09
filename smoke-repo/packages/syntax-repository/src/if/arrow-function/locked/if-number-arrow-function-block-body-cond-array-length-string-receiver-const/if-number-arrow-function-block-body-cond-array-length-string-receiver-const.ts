const receiver: readonly string[] = ['a', 'b', 'c'];

export const ifNumberArrowFunctionBlockBodyCondArrayLengthStringReceiverConst = (): string => {
    if (receiver.length) {
        return 'then';
    }
    return 'else';
};
