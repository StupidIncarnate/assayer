export const ternaryBooleanArrowFunctionBlockBodyCondGtStringValueExternal = (): string => {
    return (process.argv[2] ?? '') > 'm' ? 'then' : 'else';
};
