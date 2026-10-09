const value = process.env.VALUE === 'true';

export class TernaryBooleanClassStaticFieldCondNotBooleanValueEnv {
    public static label = !value ? 'then' : 'else';
}
