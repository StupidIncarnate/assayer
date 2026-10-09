export class TernaryStringClassMethodCondNullishStringValueParam {
    public run(value: string | undefined): string {
        return value ?? '' ? 'then' : 'else';
    }
}
