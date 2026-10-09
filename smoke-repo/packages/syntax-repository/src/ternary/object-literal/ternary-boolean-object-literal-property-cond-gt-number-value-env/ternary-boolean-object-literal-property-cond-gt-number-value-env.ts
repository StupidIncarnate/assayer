const value = Number(process.env.VALUE);

export const ternaryBooleanObjectLiteralPropertyCondGtNumberValueEnv = {
    label: value > 5 ? 'then' : 'else',
};
