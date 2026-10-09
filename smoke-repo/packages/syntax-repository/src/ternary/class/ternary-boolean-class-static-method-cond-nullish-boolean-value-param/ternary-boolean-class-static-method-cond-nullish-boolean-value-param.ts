export class TernaryBooleanClassStaticMethodCondNullishBooleanValueParam {
    public static run(value: boolean | undefined): string {
        return value ?? false ? 'then' : 'else';
    }
}
