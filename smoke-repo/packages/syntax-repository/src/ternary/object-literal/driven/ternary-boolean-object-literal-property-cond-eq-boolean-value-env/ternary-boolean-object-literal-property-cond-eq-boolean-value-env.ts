const value = process.env.VALUE === 'true';

export const ternaryBooleanObjectLiteralPropertyCondEqBooleanValueEnv = {
    label: value === false ? 'then' : 'else',
};
