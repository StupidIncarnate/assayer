const value = process.env.VALUE === undefined ? undefined : process.env.VALUE ?? '';

export const ternaryStringObjectLiteralPropertyCondNullishStringValueEnv = {
    label: value ?? '' ? 'then' : 'else',
};
