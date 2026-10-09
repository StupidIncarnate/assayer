export const ifBooleanArrowFunctionBlockBodyCondGtStringValueExternal = (): string => {
    if ((process.argv[2] ?? '') > 'm') {
        return 'then';
    }
    return 'else';
};
