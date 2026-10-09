const value = Number(process.env.VALUE);

export const ifBooleanIifeCondGtNumberValueEnv = ((): string => {
    if (value > 5) {
        return 'then';
    }
    return 'else';
})();
