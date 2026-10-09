const value: string = 'abc';

export const ifBooleanFunctionExpressionCondGtStringValueConst = function (): string {
    if (value > 'm') {
        return 'then';
    }
    return 'else';
};
