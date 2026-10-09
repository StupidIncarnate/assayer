const value = process.env.VALUE ?? '';

export class TernaryBooleanClassStaticFieldCondGtStringValueEnv {
    public static label = value > 'm' ? 'then' : 'else';
}
