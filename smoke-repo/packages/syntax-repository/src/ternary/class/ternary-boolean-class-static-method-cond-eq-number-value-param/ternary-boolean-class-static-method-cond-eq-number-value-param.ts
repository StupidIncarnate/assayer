export class TernaryBooleanClassStaticMethodCondEqNumberValueParam {
    public static run(value: number): string {
        return value === 7 ? 'then' : 'else';
    }
}
