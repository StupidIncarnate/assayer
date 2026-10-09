export const ternaryBooleanArrowFunctionBlockBodyCondNotNumberValueExternal = (): string => {
    return !Number(process.argv[2]) ? 'then' : 'else';
};
