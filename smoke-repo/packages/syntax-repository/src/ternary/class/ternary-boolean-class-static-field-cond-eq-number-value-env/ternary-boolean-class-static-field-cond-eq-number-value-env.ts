const value = Number(process.env.VALUE);

export class TernaryBooleanClassStaticFieldCondEqNumberValueEnv {
    public static label = value === 7 ? 'then' : 'else';
}
