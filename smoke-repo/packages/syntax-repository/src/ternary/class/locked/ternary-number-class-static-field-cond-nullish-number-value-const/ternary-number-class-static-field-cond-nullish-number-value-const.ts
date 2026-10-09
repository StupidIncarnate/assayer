const value: number | undefined = 3;

export class TernaryNumberClassStaticFieldCondNullishNumberValueConst {
    public static label = value ?? 0 ? 'then' : 'else';
}
