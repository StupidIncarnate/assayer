const value = process.env.VALUE === undefined ? undefined : Number(process.env.VALUE);

export const ternaryNumberIifeCondNullishNumberValueEnv = ((): string => {
    return value ?? 0 ? 'then' : 'else';
})();
