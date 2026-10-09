const value: number = 3;

export const ifBooleanArrowFunctionBlockBodyCondGtNumberValueConst = (): string => {
    if (value > 5) {
        return 'then';
    }
    return 'else';
};
