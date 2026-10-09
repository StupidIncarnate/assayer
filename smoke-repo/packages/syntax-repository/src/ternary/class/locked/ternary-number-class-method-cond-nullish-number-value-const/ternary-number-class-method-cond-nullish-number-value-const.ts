const value: number | undefined = 3;

export class TernaryNumberClassMethodCondNullishNumberValueConst {
    public run(): string {
        return value ?? 0 ? 'then' : 'else';
    }
}
