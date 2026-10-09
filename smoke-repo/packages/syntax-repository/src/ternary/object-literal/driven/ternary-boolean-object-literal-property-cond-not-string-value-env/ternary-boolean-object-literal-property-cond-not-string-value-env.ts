const value = process.env.VALUE ?? '';

export const ternaryBooleanObjectLiteralPropertyCondNotStringValueEnv = {
    label: !value ? 'then' : 'else',
};
