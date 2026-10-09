const value = process.env.VALUE === 'true';

export class TernaryBooleanClassStaticFieldCondEqBooleanValueEnv {
    public static label = value === false ? 'then' : 'else';
}
