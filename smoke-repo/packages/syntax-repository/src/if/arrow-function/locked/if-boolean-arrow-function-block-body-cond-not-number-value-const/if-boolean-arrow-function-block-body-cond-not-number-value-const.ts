const value: number = 3;

export const ifBooleanArrowFunctionBlockBodyCondNotNumberValueConst = (): string => {
    if (!value) {
        return 'then';
    }
    return 'else';
};
