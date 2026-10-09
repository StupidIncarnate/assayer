const cond = Number(process.env.COND);

export const ternaryNumberObjectLiteralPropertyCondEnv = {
    label: cond ? 'then' : 'else',
};
