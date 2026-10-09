const value = process.env.VALUE ?? '';

export const ternaryBooleanObjectLiteralPropertyCondEqStringValueEnv = {
    label: value === 'xyz' ? 'then' : 'else',
};
