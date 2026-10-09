const value: boolean | undefined = true;

export class IfBooleanClassStaticMethodCondNullishBooleanValueConst {
    public static run(): string {
        if (value ?? false) {
            return 'then';
        }
        return 'else';
    }
}
