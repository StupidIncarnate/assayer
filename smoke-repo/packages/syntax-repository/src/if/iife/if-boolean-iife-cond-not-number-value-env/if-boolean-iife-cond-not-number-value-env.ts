const value = Number(process.env.VALUE);

export const ifBooleanIifeCondNotNumberValueEnv = ((): string => {
    if (!value) {
        return 'then';
    }
    return 'else';
})();
