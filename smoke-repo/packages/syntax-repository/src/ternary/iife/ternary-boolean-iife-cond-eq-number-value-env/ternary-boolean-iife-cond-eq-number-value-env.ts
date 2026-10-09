const value = Number(process.env.VALUE);

export const ternaryBooleanIifeCondEqNumberValueEnv = ((): string => {
    return value === 7 ? 'then' : 'else';
})();
