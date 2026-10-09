const value = Number(process.env.VALUE);

export class TernaryBooleanClassStaticFieldCondGtNumberValueEnv {
    public static label = value > 5 ? 'then' : 'else';
}
