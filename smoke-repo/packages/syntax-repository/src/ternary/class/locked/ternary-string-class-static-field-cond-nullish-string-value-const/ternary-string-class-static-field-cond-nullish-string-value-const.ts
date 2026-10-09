const value: string | undefined = 'abc';

export class TernaryStringClassStaticFieldCondNullishStringValueConst {
    public static label = value ?? '' ? 'then' : 'else';
}
