export class IfBooleanClassMethodCondEqStringValueParam {
    public run(value: string): string {
        if (value === 'xyz') {
            return 'then';
        }
        return 'else';
    }
}
