export class TernaryNumberClassStaticMethodCondNullishNumberValueParam {
    public static run(value: number | undefined): string {
        return value ?? 0 ? 'then' : 'else';
    }
}
