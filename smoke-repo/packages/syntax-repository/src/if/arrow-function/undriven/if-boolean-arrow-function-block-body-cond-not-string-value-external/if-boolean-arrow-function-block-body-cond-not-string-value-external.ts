export const ifBooleanArrowFunctionBlockBodyCondNotStringValueExternal = (): string => {
    if (!(process.argv[2] ?? '')) {
        return 'then';
    }
    return 'else';
};
