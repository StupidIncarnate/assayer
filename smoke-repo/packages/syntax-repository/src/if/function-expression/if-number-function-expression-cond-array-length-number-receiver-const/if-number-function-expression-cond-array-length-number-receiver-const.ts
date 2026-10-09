const receiver: readonly number[] = [10, 20, 30];

export const ifNumberFunctionExpressionCondArrayLengthNumberReceiverConst = function (): string {
    if (receiver.length) {
        return 'then';
    }
    return 'else';
};
