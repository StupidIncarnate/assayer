const value = Number(process.env.VALUE);

export class TernaryBooleanClassStaticFieldCondNotNumberValueEnv {
    public static label = !value ? 'then' : 'else';
}
