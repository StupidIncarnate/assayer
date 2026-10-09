const value: number = 3;

export class TernaryBooleanClassStaticMethodCondNotNumberValueConst {
    public static run(): string {
        return !value ? 'then' : 'else';
    }
}
