export const ifBooleanArrowFunctionBlockBodyCondNotBooleanValueParam = (value: boolean): string => {
    if (!value) {
        return 'then';
    }
    return 'else';
};
