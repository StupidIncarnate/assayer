const value: boolean | undefined = true;

export class TernaryBooleanClassStaticMethodCondNullishBooleanValueConst {
    public static run(): string {
        return value ?? false ? 'then' : 'else';
    }
}
