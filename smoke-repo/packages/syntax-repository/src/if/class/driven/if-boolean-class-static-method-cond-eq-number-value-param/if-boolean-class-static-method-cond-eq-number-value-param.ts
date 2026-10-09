export class IfBooleanClassStaticMethodCondEqNumberValueParam {
    public static run(value: number): string {
        if (value === 7) {
            return 'then';
        }
        return 'else';
    }
}
