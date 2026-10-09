const value: boolean | undefined = true;

export const ternaryBooleanFunctionExpressionCondNullishBooleanValueConst = function (): string {
    return value ?? false ? 'then' : 'else';
};
