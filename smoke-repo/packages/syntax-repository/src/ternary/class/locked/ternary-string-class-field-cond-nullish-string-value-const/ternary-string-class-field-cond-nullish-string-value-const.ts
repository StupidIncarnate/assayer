const value: string | undefined = 'abc';

export class TernaryStringClassFieldCondNullishStringValueConst {
    public label = value ?? '' ? 'then' : 'else';
}
