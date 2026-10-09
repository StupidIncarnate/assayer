const value = Number(process.env.VALUE);

export const ternaryBooleanIifeCondNotNumberValueEnv = ((): string => {
    return !value ? 'then' : 'else';
})();
