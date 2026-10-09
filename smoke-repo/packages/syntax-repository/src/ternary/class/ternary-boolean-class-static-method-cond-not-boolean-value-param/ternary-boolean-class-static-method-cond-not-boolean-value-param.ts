export class TernaryBooleanClassStaticMethodCondNotBooleanValueParam {
    public static run(value: boolean): string {
        return !value ? 'then' : 'else';
    }
}
