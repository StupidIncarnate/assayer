const value: string = 'abc';

export class IfBooleanClassStaticMethodCondGtStringValueConst {
    public static run(): string {
        if (value > 'm') {
            return 'then';
        }
        return 'else';
    }
}
