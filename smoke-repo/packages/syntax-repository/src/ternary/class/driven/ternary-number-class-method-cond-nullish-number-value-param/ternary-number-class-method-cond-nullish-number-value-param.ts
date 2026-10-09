export class TernaryNumberClassMethodCondNullishNumberValueParam {
    public run(value: number | undefined): string {
        return value ?? 0 ? 'then' : 'else';
    }
}
