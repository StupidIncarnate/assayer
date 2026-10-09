export class IfBooleanClassStaticMethodCondGtStringValueParam {
    public static run(value: string): string {
        if (value > 'm') {
            return 'then';
        }
        return 'else';
    }
}
