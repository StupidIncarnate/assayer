const value: boolean | undefined = true;

export const ifBooleanFunctionExpressionCondNullishBooleanValueConst = function (): string {
    if (value ?? false) {
        return 'then';
    }
    return 'else';
};
