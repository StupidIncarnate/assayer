const value = process.env.VALUE ?? '';

export class TernaryBooleanClassStaticFieldCondNotStringValueEnv {
    public static label = !value ? 'then' : 'else';
}
