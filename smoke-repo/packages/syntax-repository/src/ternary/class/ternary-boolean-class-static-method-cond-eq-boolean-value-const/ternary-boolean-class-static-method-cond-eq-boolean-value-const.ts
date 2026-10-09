const value: boolean = true;

export class TernaryBooleanClassStaticMethodCondEqBooleanValueConst {
    public static run(): string {
        return value === false ? 'then' : 'else';
    }
}
