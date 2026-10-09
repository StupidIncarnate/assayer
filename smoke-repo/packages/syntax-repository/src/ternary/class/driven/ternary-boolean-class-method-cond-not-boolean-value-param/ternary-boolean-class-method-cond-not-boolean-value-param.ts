export class TernaryBooleanClassMethodCondNotBooleanValueParam {
    public run(value: boolean): string {
        return !value ? 'then' : 'else';
    }
}
