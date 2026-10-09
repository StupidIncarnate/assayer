const value: string = 'abc';

export class TernaryBooleanClassStaticMethodCondEqStringValueConst {
    public static run(): string {
        return value === 'xyz' ? 'then' : 'else';
    }
}
