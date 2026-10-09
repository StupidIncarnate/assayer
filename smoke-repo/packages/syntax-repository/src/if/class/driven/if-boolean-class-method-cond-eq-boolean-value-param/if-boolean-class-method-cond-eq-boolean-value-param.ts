export class IfBooleanClassMethodCondEqBooleanValueParam {
    public run(value: boolean): string {
        if (value === false) {
            return 'then';
        }
        return 'else';
    }
}
