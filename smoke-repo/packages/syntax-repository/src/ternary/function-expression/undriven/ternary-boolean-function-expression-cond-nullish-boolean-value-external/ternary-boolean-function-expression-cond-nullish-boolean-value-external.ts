export const ternaryBooleanFunctionExpressionCondNullishBooleanValueExternal = function (): string {
    return (process.argv[2] === undefined ? undefined : process.argv[2] === 'yes') ?? false ? 'then' : 'else';
};
