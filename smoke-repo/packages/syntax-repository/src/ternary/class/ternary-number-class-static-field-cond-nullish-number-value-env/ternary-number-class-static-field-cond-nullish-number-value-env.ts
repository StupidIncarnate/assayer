const value = process.env.VALUE === undefined ? undefined : Number(process.env.VALUE);

export class TernaryNumberClassStaticFieldCondNullishNumberValueEnv {
    public static label = value ?? 0 ? 'then' : 'else';
}
