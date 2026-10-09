export class IfBooleanClassStaticMethodCondNotBooleanValueParam {
    public static run(value: boolean): string {
        if (!value) {
            return 'then';
        }
        return 'else';
    }
}
