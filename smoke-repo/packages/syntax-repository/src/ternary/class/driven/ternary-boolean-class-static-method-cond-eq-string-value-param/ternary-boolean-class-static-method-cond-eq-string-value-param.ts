export class TernaryBooleanClassStaticMethodCondEqStringValueParam {
    public static run(value: string): string {
        return value === 'xyz' ? 'then' : 'else';
    }
}
