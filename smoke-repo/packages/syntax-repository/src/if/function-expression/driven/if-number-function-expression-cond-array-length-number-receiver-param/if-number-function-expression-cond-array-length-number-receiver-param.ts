export const ifNumberFunctionExpressionCondArrayLengthNumberReceiverParam = function (receiver: readonly number[]): string {
    if (receiver.length) {
        return 'then';
    }
    return 'else';
};
