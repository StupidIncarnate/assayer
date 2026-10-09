export class IfBooleanClassStaticMethodCondNotStringValueParam {
    public static run(value: string): string {
        if (!value) {
            return 'then';
        }
        return 'else';
    }
}
