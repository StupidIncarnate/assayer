const cond = process.env.COND === 'true';

export class TernaryBooleanClassStaticFieldCondEnv {
    public static label = cond ? 'then' : 'else';
}
