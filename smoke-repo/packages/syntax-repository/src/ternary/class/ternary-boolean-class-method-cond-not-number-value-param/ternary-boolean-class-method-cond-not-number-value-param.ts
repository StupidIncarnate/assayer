export class TernaryBooleanClassMethodCondNotNumberValueParam {
    public run(value: number): string {
        return !value ? 'then' : 'else';
    }
}
