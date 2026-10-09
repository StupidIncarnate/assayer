export const ternaryBooleanIifeCondNotNumberValueExternal = ((): string => {
    return !Number(process.argv[2]) ? 'then' : 'else';
})();
