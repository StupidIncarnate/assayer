export const ifNumberArrowFunctionBlockBodyCondArrayLengthStringReceiverParam = (receiver: readonly string[]): string => {
    if (receiver.length) {
        return 'then';
    }
    return 'else';
};
