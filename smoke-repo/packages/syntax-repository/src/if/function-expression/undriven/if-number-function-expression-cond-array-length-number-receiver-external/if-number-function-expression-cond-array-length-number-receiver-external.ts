export const ifNumberFunctionExpressionCondArrayLengthNumberReceiverExternal = function (): string {
    if (process.argv.slice(2).map(Number).length) {
        return 'then';
    }
    return 'else';
};
