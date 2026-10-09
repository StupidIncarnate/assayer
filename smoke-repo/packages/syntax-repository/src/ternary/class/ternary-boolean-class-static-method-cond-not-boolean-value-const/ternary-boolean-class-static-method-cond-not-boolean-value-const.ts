const value: boolean = true;

export class TernaryBooleanClassStaticMethodCondNotBooleanValueConst {
    public static run(): string {
        return !value ? 'then' : 'else';
    }
}
