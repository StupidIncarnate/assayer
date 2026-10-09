export const ifBooleanArrowFunctionBlockBodyCondNotBooleanValueExternal = (): string => {
    if (!(process.argv[2] === 'yes')) {
        return 'then';
    }
    return 'else';
};
