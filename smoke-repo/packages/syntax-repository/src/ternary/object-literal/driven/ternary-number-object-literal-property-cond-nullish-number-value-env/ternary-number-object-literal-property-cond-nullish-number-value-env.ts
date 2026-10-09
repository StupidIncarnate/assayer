const value = process.env.VALUE === undefined ? undefined : Number(process.env.VALUE);

export const ternaryNumberObjectLiteralPropertyCondNullishNumberValueEnv = {
    label: value ?? 0 ? 'then' : 'else',
};
