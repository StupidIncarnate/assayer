export const ifBooleanArrowFunctionBlockBodyCondNullishBooleanValueParam = (value: boolean | undefined): string => {
    if (value ?? false) {
        return 'then';
    }
    return 'else';
};
