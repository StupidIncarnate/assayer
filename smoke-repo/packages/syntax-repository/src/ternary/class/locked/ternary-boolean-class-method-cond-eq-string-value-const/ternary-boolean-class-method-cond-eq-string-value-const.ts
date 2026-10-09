const value: string = 'abc';

export class TernaryBooleanClassMethodCondEqStringValueConst {
    public run(): string {
        return value === 'xyz' ? 'then' : 'else';
    }
}
