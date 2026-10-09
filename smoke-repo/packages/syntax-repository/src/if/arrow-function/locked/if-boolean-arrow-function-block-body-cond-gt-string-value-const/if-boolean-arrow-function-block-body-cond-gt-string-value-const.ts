const value: string = 'abc';

export const ifBooleanArrowFunctionBlockBodyCondGtStringValueConst = (): string => {
    if (value > 'm') {
        return 'then';
    }
    return 'else';
};
