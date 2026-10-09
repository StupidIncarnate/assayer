export const ifNumberFunctionExpressionCondStringLengthReceiverExternal = function (): string {
    if ((process.argv[2] ?? '').length) {
        return 'then';
    }
    return 'else';
};
