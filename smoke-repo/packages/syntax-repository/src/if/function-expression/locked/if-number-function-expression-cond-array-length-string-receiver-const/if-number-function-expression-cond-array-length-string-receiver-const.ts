const receiver: readonly string[] = ['a', 'b', 'c'];

export const ifNumberFunctionExpressionCondArrayLengthStringReceiverConst = function (): string {
    if (receiver.length) {
        return 'then';
    }
    return 'else';
};
