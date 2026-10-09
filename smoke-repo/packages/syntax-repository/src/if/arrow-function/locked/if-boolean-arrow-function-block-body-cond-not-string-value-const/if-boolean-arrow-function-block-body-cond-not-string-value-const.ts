const value: string = 'abc';

export const ifBooleanArrowFunctionBlockBodyCondNotStringValueConst = (): string => {
    if (!value) {
        return 'then';
    }
    return 'else';
};
