export class IfBooleanClassStaticMethodCondGtNumberValueParam {
    public static run(value: number): string {
        if (value > 5) {
            return 'then';
        }
        return 'else';
    }
}
