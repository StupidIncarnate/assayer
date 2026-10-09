export const ifNumberFunctionExpressionCondStringLengthReceiverParam = function (receiver: string): string {
    if (receiver.length) {
        return 'then';
    }
    return 'else';
};
