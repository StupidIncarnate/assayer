export const ifStringArrowFunctionBlockBodyCondNullishStringValueParam = (value: string | undefined): string => {
    if (value ?? '') {
        return 'then';
    }
    return 'else';
};
