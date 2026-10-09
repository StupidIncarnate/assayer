const value = process.env.VALUE === undefined ? undefined : process.env.VALUE === 'true';

export class TernaryBooleanClassStaticFieldCondNullishBooleanValueEnv {
    public static label = value ?? false ? 'then' : 'else';
}
