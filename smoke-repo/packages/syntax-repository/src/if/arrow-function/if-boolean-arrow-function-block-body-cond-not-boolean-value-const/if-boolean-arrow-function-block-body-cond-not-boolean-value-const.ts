const value: boolean = true;

export const ifBooleanArrowFunctionBlockBodyCondNotBooleanValueConst = (): string => {
    if (!value) {
        return 'then';
    }
    return 'else';
};
