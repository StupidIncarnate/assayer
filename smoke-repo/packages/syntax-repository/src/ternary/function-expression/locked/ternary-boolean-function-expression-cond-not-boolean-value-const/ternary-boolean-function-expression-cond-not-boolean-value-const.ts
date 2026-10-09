const value: boolean = true;

export const ternaryBooleanFunctionExpressionCondNotBooleanValueConst = function (): string {
    return !value ? 'then' : 'else';
};
