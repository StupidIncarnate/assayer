export const ifBooleanArrowFunctionBlockBodyCondNotNumberValueExternal = (): string => {
    if (!Number(process.argv[2])) {
        return 'then';
    }
    return 'else';
};
