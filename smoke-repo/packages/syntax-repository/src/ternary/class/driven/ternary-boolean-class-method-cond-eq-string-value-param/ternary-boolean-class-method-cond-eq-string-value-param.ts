export class TernaryBooleanClassMethodCondEqStringValueParam {
    public run(value: string): string {
        return value === 'xyz' ? 'then' : 'else';
    }
}
