export const ifNumberFunctionExpressionCondArrayLengthStringReceiverExternal = function (): string {
    if (process.argv.slice(2).length) {
        return 'then';
    }
    return 'else';
};
