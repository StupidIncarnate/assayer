const value = process.env.VALUE === undefined ? undefined : process.env.VALUE === 'true';

export const ternaryBooleanObjectLiteralPropertyCondNullishBooleanValueEnv = {
    label: value ?? false ? 'then' : 'else',
};
