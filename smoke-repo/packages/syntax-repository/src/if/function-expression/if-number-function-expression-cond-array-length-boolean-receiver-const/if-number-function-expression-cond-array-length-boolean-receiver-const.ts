const receiver: readonly boolean[] = [true, false, true];

export const ifNumberFunctionExpressionCondArrayLengthBooleanReceiverConst = function (): string {
    if (receiver.length) {
        return 'then';
    }
    return 'else';
};
