export const ternaryBooleanArrowFunctionBlockBodyCondEqStringValueExternal = (): string => {
    return (process.argv[2] ?? '') === 'xyz' ? 'then' : 'else';
};
