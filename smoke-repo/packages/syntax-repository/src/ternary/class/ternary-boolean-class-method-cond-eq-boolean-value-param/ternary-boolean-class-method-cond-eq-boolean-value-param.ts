export class TernaryBooleanClassMethodCondEqBooleanValueParam {
    public run(value: boolean): string {
        return value === false ? 'then' : 'else';
    }
}
