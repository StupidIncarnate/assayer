const value: number | undefined = 3;

export class TernaryNumberClassFieldCondNullishNumberValueConst {
    public label = value ?? 0 ? 'then' : 'else';
}
