const value: string = 'abc';

export class IfBooleanClassStaticMethodCondNotStringValueConst {
    public static run(): string {
        if (!value) {
            return 'then';
        }
        return 'else';
    }
}
