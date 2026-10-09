export const ifNumberFunctionExpressionCondArrayLengthStringReceiverParam = function (receiver: readonly string[]): string {
    if (receiver.length) {
        return 'then';
    }
    return 'else';
};
