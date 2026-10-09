export const ternaryBooleanArrowFunctionBlockBodyCondNotBooleanValueExternal = (): string => {
    return !(process.argv[2] === 'yes') ? 'then' : 'else';
};
