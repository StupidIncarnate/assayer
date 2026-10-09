const cond = process.env.COND ?? '';

export class TernaryStringClassStaticFieldCondEnv {
    public static label = cond ? 'then' : 'else';
}
