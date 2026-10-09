export const ifBooleanIifeCondGtNumberValueExternal = ((): string => {
    if (Number(process.argv[2]) > 5) {
        return 'then';
    }
    return 'else';
})();
