const cond = process.env.COND === 'true';

export const ternaryBooleanObjectLiteralPropertyCondEnv = {
    label: cond ? 'then' : 'else',
};
