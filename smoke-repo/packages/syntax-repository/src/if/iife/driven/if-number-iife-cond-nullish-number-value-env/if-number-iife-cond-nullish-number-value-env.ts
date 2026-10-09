const value = process.env.VALUE === undefined ? undefined : Number(process.env.VALUE);

export const ifNumberIifeCondNullishNumberValueEnv = ((): string => {
    if (value ?? 0) {
        return 'then';
    }
    return 'else';
})();
