const value: string = 'abc';

export const ifBooleanFunctionExpressionCondEqStringValueConst = function (): string {
    if (value === 'xyz') {
        return 'then';
    }
    return 'else';
};
