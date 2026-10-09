export const ifBooleanArrowFunctionBlockBodyCondGtStringValueParam = (value: string): string => {
    if (value > 'm') {
        return 'then';
    }
    return 'else';
};
