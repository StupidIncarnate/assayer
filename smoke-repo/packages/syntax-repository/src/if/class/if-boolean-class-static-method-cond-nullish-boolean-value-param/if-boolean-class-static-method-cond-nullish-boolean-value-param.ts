export class IfBooleanClassStaticMethodCondNullishBooleanValueParam {
    public static run(value: boolean | undefined): string {
        if (value ?? false) {
            return 'then';
        }
        return 'else';
    }
}
