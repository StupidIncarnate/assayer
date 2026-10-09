export class IfBooleanClassStaticMethodCondEqStringValueParam {
    public static run(value: string): string {
        if (value === 'xyz') {
            return 'then';
        }
        return 'else';
    }
}
