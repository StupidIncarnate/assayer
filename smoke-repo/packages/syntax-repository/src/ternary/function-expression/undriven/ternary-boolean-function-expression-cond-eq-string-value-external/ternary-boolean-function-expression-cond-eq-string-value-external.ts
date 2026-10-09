export const ternaryBooleanFunctionExpressionCondEqStringValueExternal = function (): string {
    return (process.argv[2] ?? '') === 'xyz' ? 'then' : 'else';
};
