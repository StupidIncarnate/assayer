const value = Number(process.env.VALUE);

export const ifBooleanIifeCondEqNumberValueEnv = ((): string => {
    if (value === 7) {
        return 'then';
    }
    return 'else';
})();
