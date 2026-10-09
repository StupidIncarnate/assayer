export const ternaryNumberFunctionExpressionCondStringLengthReceiverExternal = function (): string {
    return (process.argv[2] ?? '').length ? 'then' : 'else';
};
