export const ternaryBooleanArrowFunctionBlockBodyCondEqNumberValueExternal = (): string => {
    return Number(process.argv[2]) === 7 ? 'then' : 'else';
};
