const value: string = 'abc';

export class IfBooleanClassStaticMethodCondEqStringValueConst {
    public static run(): string {
        if (value === 'xyz') {
            return 'then';
        }
        return 'else';
    }
}
