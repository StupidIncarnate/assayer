export class IfBooleanClassStaticMethodCondEqBooleanValueParam {
    public static run(value: boolean): string {
        if (value === false) {
            return 'then';
        }
        return 'else';
    }
}
