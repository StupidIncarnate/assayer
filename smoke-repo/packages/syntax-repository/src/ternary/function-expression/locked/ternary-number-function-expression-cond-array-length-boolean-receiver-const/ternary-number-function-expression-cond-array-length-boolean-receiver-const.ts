const receiver: readonly boolean[] = [true, false, true];

export const ternaryNumberFunctionExpressionCondArrayLengthBooleanReceiverConst = function (): string {
    return receiver.length ? 'then' : 'else';
};
