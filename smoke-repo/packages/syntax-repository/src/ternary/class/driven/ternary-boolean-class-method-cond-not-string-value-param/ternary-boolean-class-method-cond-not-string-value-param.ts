export class TernaryBooleanClassMethodCondNotStringValueParam {
    public run(value: string): string {
        return !value ? 'then' : 'else';
    }
}
