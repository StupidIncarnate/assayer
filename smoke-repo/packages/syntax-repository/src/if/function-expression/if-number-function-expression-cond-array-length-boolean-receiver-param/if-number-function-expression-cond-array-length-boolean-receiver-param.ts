export const ifNumberFunctionExpressionCondArrayLengthBooleanReceiverParam = function (receiver: readonly boolean[]): string {
    if (receiver.length) {
        return 'then';
    }
    return 'else';
};
