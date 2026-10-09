export class IfBooleanClassStaticMethodCondNotNumberValueParam {
    public static run(value: number): string {
        if (!value) {
            return 'then';
        }
        return 'else';
    }
}
