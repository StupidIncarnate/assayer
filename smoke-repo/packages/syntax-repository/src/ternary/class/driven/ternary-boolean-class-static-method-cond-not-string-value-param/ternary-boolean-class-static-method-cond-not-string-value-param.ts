export class TernaryBooleanClassStaticMethodCondNotStringValueParam {
    public static run(value: string): string {
        return !value ? 'then' : 'else';
    }
}
