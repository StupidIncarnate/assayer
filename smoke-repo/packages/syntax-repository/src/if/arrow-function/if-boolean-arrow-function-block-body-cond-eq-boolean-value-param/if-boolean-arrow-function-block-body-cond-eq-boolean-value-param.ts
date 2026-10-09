export const ifBooleanArrowFunctionBlockBodyCondEqBooleanValueParam = (value: boolean): string => {
    if (value === false) {
        return 'then';
    }
    return 'else';
};
