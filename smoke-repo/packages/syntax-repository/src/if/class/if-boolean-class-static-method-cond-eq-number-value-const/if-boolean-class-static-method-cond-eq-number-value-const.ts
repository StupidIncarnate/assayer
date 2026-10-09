const value: number = 3;

export class IfBooleanClassStaticMethodCondEqNumberValueConst {
    public static run(): string {
        if (value === 7) {
            return 'then';
        }
        return 'else';
    }
}
