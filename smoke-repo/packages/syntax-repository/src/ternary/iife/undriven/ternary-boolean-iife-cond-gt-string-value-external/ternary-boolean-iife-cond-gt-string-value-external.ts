export const ternaryBooleanIifeCondGtStringValueExternal = ((): string => {
    return (process.argv[2] ?? '') > 'm' ? 'then' : 'else';
})();
