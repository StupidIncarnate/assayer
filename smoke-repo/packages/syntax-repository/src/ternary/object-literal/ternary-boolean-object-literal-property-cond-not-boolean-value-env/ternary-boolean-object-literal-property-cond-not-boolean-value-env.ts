const value = process.env.VALUE === 'true';

export const ternaryBooleanObjectLiteralPropertyCondNotBooleanValueEnv = {
    label: !value ? 'then' : 'else',
};
