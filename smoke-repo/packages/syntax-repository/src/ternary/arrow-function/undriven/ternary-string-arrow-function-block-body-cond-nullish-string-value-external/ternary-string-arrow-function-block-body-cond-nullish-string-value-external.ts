export const ternaryStringArrowFunctionBlockBodyCondNullishStringValueExternal = (): string => {
    return (process.argv[2] === undefined ? undefined : process.argv[2] ?? '') ?? '' ? 'then' : 'else';
};
