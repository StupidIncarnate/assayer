const value: string = 'abc';

export class TernaryBooleanClassStaticMethodCondNotStringValueConst {
    public static run(): string {
        return !value ? 'then' : 'else';
    }
}
