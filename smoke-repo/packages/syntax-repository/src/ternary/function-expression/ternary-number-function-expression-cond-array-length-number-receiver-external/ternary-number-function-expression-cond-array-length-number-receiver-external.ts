export const ternaryNumberFunctionExpressionCondArrayLengthNumberReceiverExternal = function (): string {
    return process.argv.slice(2).map(Number).length ? 'then' : 'else';
};
