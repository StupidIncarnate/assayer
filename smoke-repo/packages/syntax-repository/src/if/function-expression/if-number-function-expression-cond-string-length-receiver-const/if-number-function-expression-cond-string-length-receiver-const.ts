const receiver: string = 'abc';

export const ifNumberFunctionExpressionCondStringLengthReceiverConst = function (): string {
    if (receiver.length) {
        return 'then';
    }
    return 'else';
};
