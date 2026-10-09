const cond = Number(process.env.COND);

export class TernaryNumberClassStaticFieldCondEnv {
    public static label = cond ? 'then' : 'else';
}
