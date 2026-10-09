const value: boolean = true;

export class IfBooleanClassStaticMethodCondEqBooleanValueConst {
    public static run(): string {
        if (value === false) {
            return 'then';
        }
        return 'else';
    }
}
