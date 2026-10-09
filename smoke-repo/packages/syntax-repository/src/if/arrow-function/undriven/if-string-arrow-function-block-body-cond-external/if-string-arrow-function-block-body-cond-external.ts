export const ifStringArrowFunctionBlockBodyCondExternal = (): string => {
    if (process.argv[2] ?? '') {
        return 'then';
    }
    return 'else';
};
