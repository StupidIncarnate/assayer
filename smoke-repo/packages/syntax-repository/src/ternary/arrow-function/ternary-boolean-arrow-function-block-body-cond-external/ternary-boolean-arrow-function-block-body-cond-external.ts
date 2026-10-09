export const ternaryBooleanArrowFunctionBlockBodyCondExternal = (): string => {
    return process.argv[2] === 'yes' ? 'then' : 'else';
};
