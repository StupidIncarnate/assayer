export class TernaryBooleanClassMethodCondNullishBooleanValueParam {
    public run(value: boolean | undefined): string {
        return value ?? false ? 'then' : 'else';
    }
}
