const value = process.env.VALUE === undefined ? undefined : process.env.VALUE ?? '';

export const ternaryStringIifeCondNullishStringValueEnv = ((): string => {
    return value ?? '' ? 'then' : 'else';
})();
