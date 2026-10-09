const value = Number(process.env.VALUE);

export const ternaryBooleanObjectLiteralPropertyCondNotNumberValueEnv = {
    label: !value ? 'then' : 'else',
};
