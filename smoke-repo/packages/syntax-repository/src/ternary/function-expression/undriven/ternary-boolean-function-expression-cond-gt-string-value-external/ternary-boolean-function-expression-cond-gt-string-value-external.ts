export const ternaryBooleanFunctionExpressionCondGtStringValueExternal = function (): string {
    return (process.argv[2] ?? '') > 'm' ? 'then' : 'else';
};
