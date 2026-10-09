export class TernaryBooleanClassStaticMethodCondGtNumberValueParam {
    public static run(value: number): string {
        return value > 5 ? 'then' : 'else';
    }
}
