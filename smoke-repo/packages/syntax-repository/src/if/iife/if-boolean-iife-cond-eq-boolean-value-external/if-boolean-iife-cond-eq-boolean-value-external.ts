export const ifBooleanIifeCondEqBooleanValueExternal = ((): string => {
    if (process.argv[2] === 'yes' === false) {
        return 'then';
    }
    return 'else';
})();
