const value: number | undefined = 3;

export class TernaryNumberClassGetterCondNullishNumberValueConst {
    public get result(): string {
        return value ?? 0 ? 'then' : 'else';
    }
}
