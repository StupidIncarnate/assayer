export const ternaryBooleanArrowFunctionBlockBodyCondNotStringValueExternal = (): string => {
    return !(process.argv[2] ?? '') ? 'then' : 'else';
};
