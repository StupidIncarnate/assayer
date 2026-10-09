export const ternaryStringArrowFunctionBlockBodyCondExternal = (): string => {
    return process.argv[2] ?? '' ? 'then' : 'else';
};
