const value: number = 3;

export class IfBooleanClassStaticMethodCondGtNumberValueConst {
    public static run(): string {
        if (value > 5) {
            return 'then';
        }
        return 'else';
    }
}
