const value = process.env.VALUE ?? '';

export const ternaryBooleanObjectLiteralPropertyCondGtStringValueEnv = {
    label: value > 'm' ? 'then' : 'else',
};
