const cond: string = 'abc';

export const ifStringFunctionExpressionCondConst = function (): string {
    if (cond) {
        return 'then';
    }
    return 'else';
};
