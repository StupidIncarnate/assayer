const cond: boolean = true;

export const ifBooleanFunctionExpressionCondConst = function (): string {
    if (cond) {
        return 'then';
    }
    return 'else';
};
