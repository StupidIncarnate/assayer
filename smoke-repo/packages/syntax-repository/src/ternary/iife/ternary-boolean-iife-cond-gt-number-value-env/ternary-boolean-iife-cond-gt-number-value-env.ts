const value = Number(process.env.VALUE);

export const ternaryBooleanIifeCondGtNumberValueEnv = ((): string => {
    return value > 5 ? 'then' : 'else';
})();
