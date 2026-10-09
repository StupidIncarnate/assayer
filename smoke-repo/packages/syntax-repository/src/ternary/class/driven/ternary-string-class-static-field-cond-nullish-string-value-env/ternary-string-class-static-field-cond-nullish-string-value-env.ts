const value = process.env.VALUE === undefined ? undefined : process.env.VALUE ?? '';

export class TernaryStringClassStaticFieldCondNullishStringValueEnv {
    public static label = value ?? '' ? 'then' : 'else';
}
