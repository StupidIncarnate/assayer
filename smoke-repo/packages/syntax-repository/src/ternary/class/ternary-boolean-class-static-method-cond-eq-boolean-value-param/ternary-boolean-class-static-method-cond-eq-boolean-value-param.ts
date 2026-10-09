export class TernaryBooleanClassStaticMethodCondEqBooleanValueParam {
    public static run(value: boolean): string {
        return value === false ? 'then' : 'else';
    }
}
