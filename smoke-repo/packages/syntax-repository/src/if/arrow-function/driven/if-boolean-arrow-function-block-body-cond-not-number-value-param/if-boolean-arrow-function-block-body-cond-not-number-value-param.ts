export const ifBooleanArrowFunctionBlockBodyCondNotNumberValueParam = (value: number): string => {
    if (!value) {
        return 'then';
    }
    return 'else';
};
