const value: number = 3;

export class IfBooleanClassStaticMethodCondNotNumberValueConst {
    public static run(): string {
        if (!value) {
            return 'then';
        }
        return 'else';
    }
}
