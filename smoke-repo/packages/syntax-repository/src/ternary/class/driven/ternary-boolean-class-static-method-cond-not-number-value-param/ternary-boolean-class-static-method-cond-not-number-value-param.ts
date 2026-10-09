export class TernaryBooleanClassStaticMethodCondNotNumberValueParam {
    public static run(value: number): string {
        return !value ? 'then' : 'else';
    }
}
