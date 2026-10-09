export const ternaryBooleanArrowFunctionBlockBodyCondGtNumberValueExternal = (): string => {
    return Number(process.argv[2]) > 5 ? 'then' : 'else';
};
