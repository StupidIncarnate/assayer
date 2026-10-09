export const ifBooleanArrowFunctionBlockBodyCondNotStringValueParam = (value: string): string => {
    if (!value) {
        return 'then';
    }
    return 'else';
};
