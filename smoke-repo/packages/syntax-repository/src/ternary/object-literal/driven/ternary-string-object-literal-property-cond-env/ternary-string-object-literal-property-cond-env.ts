const cond = process.env.COND ?? '';

export const ternaryStringObjectLiteralPropertyCondEnv = {
    label: cond ? 'then' : 'else',
};
