export const ternaryBooleanFunctionExpressionCondNotStringValueExternal = function (): string {
    return !(process.argv[2] ?? '') ? 'then' : 'else';
};
