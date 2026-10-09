const value = process.env.VALUE ?? '';

export class TernaryBooleanClassStaticFieldCondEqStringValueEnv {
    public static label = value === 'xyz' ? 'then' : 'else';
}
